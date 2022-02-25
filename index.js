if(Number(process.version.slice(1).split(".")[0]) < 14) throw new Error("La version de Node.js est inférieure à la 14.0.0. Veuillez vous mettre en v14.0.0 ou plus.");

const client = new (require('./structure/RainsBot'))();
const moment = require('moment');

client.init();

client.mongoose.connection.on('reconnected', () => {
    console.log('MongoDB s\'est reconnecté')
    client.channels.cache.get(client.config.support.logs).send('✅ **Le bot a réussi a se reconnecter à MongoDB**')
})
.on('disconnected', () => {
    console.log('MongoDB s\'est déconnecté. Reconnection en cours...');
    client.channels.cache.get(client.config.support.logs).send('⚠️ **MongoDB s\'est déconnecté. Reconnection en cours...**');
})
.on('reconnectTries', () => {
    console.log('[FATAL ERROR] Impossible de se reconnecter à MongoDB. Déconnection du bot...');
    client.channels.cache.get(client.config.support.logs).send('❌ **Impossible de se reconnecter à MongoDB. Déconnection du bot...**');
    client.destroy();
})

process.on('unhandledRejection', error => {
    console.error(error);
    client.channels.cache.get(client.config.support.logs).send(`[${moment(new Date()).locale("fr").format('lll')}] [ERROR] \`\`\`${error.stack}\n\`\`\``)
})
.on('warning', warn => {
    console.warn(warn);
    client.channels.cache.get(client.config.support.logs).send(`[${moment(new Date()).locale("fr").format('lll')}] [WARN] \`\`\`${warn}\n\`\`\``);
});

client.login(process.env.TOKEN);
