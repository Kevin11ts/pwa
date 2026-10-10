
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Configuración VAPID
webpush.setVapidDetails(
    'mailto:cristian.flores@utcv.edu.mx',
    process.env.VAPID_PUBLIC,
    process.env.VAPID_PRIVATE
);

let suscripciones = [];

// Registrar suscripción
app.post('/api/subscribe', (req, res) => {

    const sub = req.body;

    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
        return res.status(400).json({
            error: 'Suscripción inválida'
        });
    }

    const yaExiste = suscripciones.some(
        (s) => s.endpoint === sub.endpoint
    );

    if (!yaExiste) {
        suscripciones.push(sub);
    }

    console.log('Suscripciones:', suscripciones.length);

    res.status(201).json({
        ok: true,
        suscripciones: suscripciones.length
    });
});

// Enviar notificaciones Push
app.post('/api/push', async (req, res) => {

    const payload = JSON.stringify({
        title: req.body.title || 'Twittor',
        body: req.body.body || 'Nuevo mensaje'
    });

    console.log('Enviando notificación:', payload);

    let enviadas = 0;
    let errores = 0;

    for (const sub of [...suscripciones]) {
        try {

            const resultado = await webpush.sendNotification(
                sub,
                payload
            );

            console.log(
                'Push aceptado:',
                resultado.statusCode
            );

            enviadas++;

        } catch (err) {

            errores++;

            console.error('Error al enviar Push:');
            console.error('Estado:', err.statusCode);
            console.error('Mensaje:', err.message);
            console.error('Detalles:', err.body);

            if (err.statusCode === 404 || err.statusCode === 410) {
                suscripciones = suscripciones.filter(
                    (s) => s.endpoint !== sub.endpoint
                );
            }
        }
    }

    res.json({
        enviadas,
        errores,
        suscripciones: suscripciones.length
    });
});

app.use('/server', (req, res) => res.sendStatus(404));

app.use(express.static(path.join(__dirname, '..', '..')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor Activo: http://localhost:${process.env.PORT || 3000}`);
});

