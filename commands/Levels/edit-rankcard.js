module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    const p = data.members.map(m => m.id).indexOf(message.author.id);
    const userData = data.members[p];
    const dbUser = await client.findOrCreateUser(message.author);

    if(p == -1 || !userData) return message.channel.send('⚠️ Cet utilisateur n\'est pas classé.');
    if(!dbUser) return message.channel.send('❌ Votre compte n\'était pas créé, veuillez réessayer.');

    let toUpdate = args[0].toLowerCase();
    if(!(toUpdate === "progress-bar" || toUpdate === "text" || toUpdate === "avatar" || toUpdate === "background")) return message.channel.send(`⚠️ Merci de spécifier un élément valide à éditer. \n**Exemples:** \n\`edit-rankcard progress-bar blue\`\n\`edit-rankcard text #ffff00\`\n\`edit-rankcard avatar 1015739\`\n\`edit-rankcard background https://i.imgur.com/HaknLzh.png\``);

    let updated = args[1];
    let isValid;
    try {
        isValid = (require('discord.js').Util.resolveColor(updated) === "NaN") ? false : true;
    } catch {
        return message.channel.send('❌ Couleur invalide !');
    }

    if(toUpdate === "background") {
        if(message.attachments.first()) {
            updated = message.attachments.first().url;
        } else if(isValid) {
            if(!isNaN(updated)) updated = updated?.toString(16);
        } else if(!updated || !updated.startsWith('https://')) return message.channel.send('❌ Merci d\'envoyer une image ou une couleur valide!');
    } else {
        updated = updated?.toUpperCase();

        if(!updated || !isValid) return message.channel.send(`⚠️ Merci de spécifier une couleur valide. \n**Exemples:** \n\`edit-rankcard progress-bar blue\`\n\`edit-rankcard text #ffff00\`\n\`edit-rankcard avatar 1015739\`\n\`edit-rankcard background https://i.imgur.com/HaknLzh.png\``);
    
        if(!isNaN(updated)) updated = updated.toString(16);
    }

    let msg;

    try {
        msg = await message.channel.send('**Voici une prévisualisation de votre rankcard :**\nVoulez-vous enregistrer les modifications ?', { 
            files: 
                [{ attachment: await client.generateRankcard(message.member, userData, { 
                    progress_bar_color: ((toUpdate === "progress-bar") ? updated : dbUser.rankcard.progress_bar_color),
                    text_color: ((toUpdate === "text") ? updated : dbUser.rankcard.text_color),
                    avatar_color: ((toUpdate === "avatar") ? updated : dbUser.rankcard.avatar_color),
                    background: ((toUpdate === "background") ? updated : dbUser.rankcard.background),
                }),
            name: "rank.png" }]
        });
    } catch {
        return message.channel.send('Une erreur est survenue lors du chargement de la rankcard, assurez-vous que vous avez bien mis une image valide.')
    }

    await msg.react("✅");
    await msg.react("❌");

    const filter = (reaction, user) => {
        return ["✅", "❌"].includes(reaction.emoji.name) && user.id === message.author.id;
    };

    msg.awaitReactions(filter, { max: 1, time: 15000, errors: ['time'] })
        .then(async (collected) => {
            if(collected.first().emoji.name === "✅") {
                await msg.delete().catch(() => {});

                switch (toUpdate) {
                    case 'progress-bar': toUpdate = "progress_bar_color"; break;
                    case 'text': toUpdate = "text_color"; break;
                    case 'avatar': toUpdate = "avatar_color"; break;
                    case 'background': toUpdate = "background"; break;
                }

                dbUser.rankcard[toUpdate] = updated;

                dbUser.markModified("rankcard");
                dbUser.save();

                message.channel.send("✅ Les modifications ont bien été enregistrées à votre rankcard.")
            } else if(collected.first().emoji.name === "❌") {
                await msg.delete().catch(() => {});

                message.channel.send("ℹ️ Les modifications n'ont pas été enregistrées.");
            }
        })
        .catch(() => message.channel.send('Temps écoulé'));
}

module.exports.help = {
    name: "edit-rankcard",
    aliases: ["edit-rankcard", "rankcard", "rank-card", "editrankcard"],
    category: 'Levels',
    description: "Editer les couleurs de sa rankcard.",
    usage: "<progress-bar | text | avatar | background>",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["ATTACH_FILES"],
    args: true
}
