module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.autorole.enabled) return message.channel.send(`⚠️ Le plugins d'autorole n'est pas activé, faites \`${data.prefix}enable autorole\` pour l'activer!`);

    const memberMsg = await message.channel.send('Envoyez le rôle à donner à tous les nouveaux membres.\nEnvoyez \'aucun\' pour ne pas en donner.');
    const memberCollector = message.channel.createMessageCollector((m) => m.author.id === message.author.id, { max: 5, time: 120000 });
    memberCollector.on('collect', async (collectedMember) => {
        if(!collectedMember.content) return message.channel.send('⚠️ Merci d\'envoyer un contenu !');

        let role = null;
        if(collectedMember.content.toLowerCase() !== 'aucun') {
            role = collectedMember.mentions.roles.first() || message.guild.roles.cache.get(collectedMember.content) || message.guild.roles.cache.find((r) => r.name.toLowerCase().includes(collectedMember.content.toLowerCase()));

            if(!message.guild.roles.cache.get(role?.id)) return message.channel.send('⚠️ Ce rôle n\'existe pas.');
            if(role.id === message.guild.roles.everyone.id) return message.channel.send('⚠️ Rôle invalide.');
            if(message.member.roles.highest <= role.position) return message.channel.send('⚠️ Vous n\'avez pas la permission de donner ce rôle.');
            if(!role.editable) return message.channel.send('⚠️ Je ne peux pas donner ce rôle, vérifiez que j\'ai les permissions nécessaires et que le rôle est bien placé en dessous de moi !');
            if(role.id == data.plugins.autorole.role) return message.channel.send('⚠️ Ce rôle est le même que celui actuellement défini.');
        }

        collectedMember.delete().catch(() => {});
        memberMsg.delete().catch(() => {});

        memberCollector.stop();

        const botMsg = await message.channel.send('Envoyez le rôles à donner à tous les bots qui rejoignent le serveur.\nEnvoyez \'aucun\' pour ne pas en donner.');
        const botCollector = message.channel.createMessageCollector((m) => m.author.id === message.author.id, { max: 5, time: 120000 });
        botCollector.on('collect', async (collectedBot) => {
            if(!collectedBot.content) return message.channel.send('⚠️ Merci d\'envoyer un contenu !');

            let botRole = null;
            if(collectedBot.content.toLowerCase() !== 'aucun') {
                botRole = collectedBot.mentions.roles.first() || message.guild.roles.cache.get(collectedBot.content) || message.guild.roles.cache.find((r) => r.name.toLowerCase().includes(collectedBot.content.toLowerCase()));

                if(!message.guild.roles.cache.get(botRole?.id)) return message.channel.send('⚠️ Ce rôle n\'existe pas.');
                if(botRole.id === message.guild.roles.everyone.id) return message.channel.send('⚠️ Rôle invalide.');
                if(message.member.roles.highest <= botRole.position) return message.channel.send('⚠️ Vous n\'avez pas la permission de donner ce rôle.');
                if(!botRole.editable) return message.channel.send('⚠️ Je ne peux pas donner ce rôle, vérifiez que j\'ai les permissions nécessaires et que le rôle est bien placé en dessous de moi !');
                if(botRole.id == data.plugins.autorole.role) return message.channel.send('⚠️ Ce rôle est le même que celui actuellement défini.');
            }

            collectedBot.delete().catch(() => {});
            botMsg.delete().catch(() => {});

            botCollector.stop();

            data.plugins.autorole = {
                enabled: true,
                role: role?.id,
                botRole: botRole?.id
            }

            data.markModified('plugins.autorole');
            data.save().then(() => {
                message.channel.send('✅ L\'autorole a bien été configuré.');
            });
        });

        botCollector.on('end', (_, reason) => {
            if(reason === 'time') return message.channel.send('❌ Vous avez mis trop de temps à répondre ! Commande annulée.');
            if(reason === 'limit') return message.channel.send('❌ Vous avez fait trop d\'essais ! Commande annulée.');
        });
    });

    memberCollector.on('end', (_, reason) => {
        if(reason === 'time') return message.channel.send('❌ Vous avez mis trop de temps à répondre ! Commande annulée.');
        if(reason === 'limit') return message.channel.send('❌ Vous avez fait trop d\'essais ! Commande annulée.');
    });
}

module.exports.help = {
    name: "autorole",
    aliases: ["autorole", "auto-role"],
    category: 'Config',
    description: "Rajouter un autorole sur le serveur.",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_ROLES"],
    botPerms: ["EMBED_LINKS"],
    args: false
}
