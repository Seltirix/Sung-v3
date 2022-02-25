let _cooldowns = {};

module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    let i0 = 0;
    let i1 = 10;
    let page = 1;

    function formatRank(r) {
        switch (r) {
            case 1: r = '🥇'; break;
            case 2: r = '🥈'; break;
            case 3: r = '🥉'; break;
            default: r = r + '.';
        }

        return r;
    }

    data.members = data.members.filter(member => message.guild.members.cache.get(member.id));

    let embed = {
        color: client.config.embed.color,
        author: {
            name: message.author.username,
            icon_url: message.author.displayAvatarURL({ dynamic: true })
        },
        title: `Page ${page}/${Math.ceil(data.members.length / 10)}`,
        description: `Classement des personnes avec le plus d'expérience sur ${message.guild.name}. Vous visionnez actuellement le top ${i1}.`,
        thumbnail: {
            url: message.guild.iconURL({ dynamci: true })
        },
        fields: [],
        footer: {
            text: client.config.embed.footer,
            icon_url: client.user.displayAvatarURL()
        }
    }

    data.members.sort((a, b) => (a.exp < b.exp) ? 1 : -1).slice(0, 10).forEach((e, i) => {
        embed.fields.push({ name: `${formatRank(i + 1)} ${message.guild.members.cache.get(e.id).user.tag}`, value: `**Niveau ${e.level}** (${e.exp} xp)` });
    });

    const msg = await message.channel.send({ embed: embed });

    await msg.react("⬅");
    await msg.react("➡");

    const c = msg.createReactionCollector((_reaction, user) => user.id === message.author.id);

    c.on("collect", async reaction => {
        if(!(_cooldowns[message.author.id] > Date.now())) {
            _cooldowns[message.author.id] = Date.now() + 1000;
        
            if(reaction.emoji.name === "⬅") {
                i0 = i0 - 10;
                i1 = i1 - 10;
                page = page - 1

                if(i0 < 0) {
                    i0 = i0 + 10;
                    i1 = i1 + 10;
                    page = page + 1;
                    return;
                }
                if(page < 1) {
                    i0 = i0 + 10;
                    i1 = i1 + 10;
                    page = page + 1;
                    return;
                }

                embed.fields = [];
                embed.title = `Page ${page}/${Math.ceil(data.members.length / 10)}`;
                embed.description = `Classement des personnes avec le plus d'expérience sur ${message.guild.name}. Vous visionnez actuellement le top ${i1}.`

                data.members.sort((a, b) => (a.exp < b.exp) ? 1 : -1).slice(i0, i1).forEach((e, i) => {
                    embed.fields.push({ name: `${formatRank(i + 1 + i0)} ${message.guild.members.cache.get(e.id).user.tag}`, value: `**Niveau ${e.level}** (${e.exp} xp)` });
                });

                msg.edit({ embed: embed });
            }

            if(reaction.emoji.name === "➡") {
                i0 = i0 + 10;
                i1 = i1 + 10;
                page = page + 1

                if(i1 > data.members.length + 10) {
                    i0 = i0 - 10;
                    i1 = i1 - 10;
                    page = page - 1;
                    return;
                }
                if(page > Math.ceil(data.members.length / 10)) {
                    i0 = i0 - 10;
                    i1 = i1 - 10;
                    page = page - 1;
                    return;
                }

                embed.fields = [];
                embed.title = `Page ${page}/${Math.ceil(data.members.length / 10)}`;
                embed.description = `Classement des personnes avec le plus d'expérience sur ${message.guild.name}. Vous visionnez actuellement le top ${i1}.`

                data.members.sort((a, b) => (a.exp < b.exp) ? 1 : -1).slice(i0, i1).forEach((e, i) => {
                    embed.fields.push({ name: `${formatRank(i + 1 + i0)} ${message.guild.members.cache.get(e.id).user.tag}`, value: `**Niveau ${e.level}** (${e.exp} xp)` });
                });

                msg.edit({ embed: embed });
            }
        }

        await reaction.users.remove(message.author.id);
    });
}

module.exports.help = {
    name: "leaderboard",
    aliases: ["leaderboard", "levels"],
    category: 'Levels',
    description: "Voir le top 10 des membres avec le niveau le plus haut.",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}