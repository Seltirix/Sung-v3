module.exports = async (client) => {
    const setActivity = () => setTimeout(async () => {
        await client.user.setPresence({ activity: { name: client.config.status.name.replace(/{serversCount}/g, client.guilds.cache.size).replace(/{usersCount}/g, client.getAllUsers), type: client.config.status.type } });

        setActivity();
    }, 30 * 60 * 1000); // 30 min

    setActivity();

    await client.user.setPresence({ activity: { name: client.config.status.name.replace(/{serversCount}/g, client.guilds.cache.size).replace(/{usersCount}/g, client.getAllUsers), type: client.config.status.type } });

    client.channels.fetch(client.config.support.logs).then(channel => {
        channel.send("✅ **Le bot est connecté!**");
        console.log(`Connecté avec succès sur ${client.user.tag}`);
    }).catch(err => {
        console.log(`Unable to send messages to the log channel :`, err);
        process.exit(1);
    });
}
