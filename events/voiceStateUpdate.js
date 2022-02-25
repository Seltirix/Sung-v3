const PrivateChannel = require('../models/PrivateChannel');

module.exports = async (client, oldState, newState) => {
    const guild = oldState.guild;
    const data = await client.getGuild(guild);
    if(!data) return;

    const member = await guild.members.fetch(newState.member).catch(() => {});
    if(!member || member?.user?.bot) return;

    const memberData = await PrivateChannel.findOne({ ownerID: member.id });
    const channel = guild.channels.resolve(memberData?.channelID);
    const oldChannel = guild.channels.resolve(oldState.channelID);

    if(!guild.me.hasPermission(['MANAGE_CHANNELS', 'MOVE_MEMBERS'])) return;

    if(data.plugins.privatechannels?.channelID && (newState.channelID === data.plugins.privatechannels?.channelID)) {
        const options = {
            type: 'voice',
            bitrate: 64000,
            userLimit: 2,
            permissionOverwrites: [
                {
                    id: member.id,
                    allow: ['CONNECT', 'SPEAK', 'STREAM','MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'MANAGE_CHANNELS', 'CREATE_INSTANT_INVITE']
                },
                {
                    id: guild.roles.everyone.id,
                    allow: ['VIEW_CHANNEL']
                },
                {
                    id: client.user.id,
                    allow: ['MANAGE_CHANNELS']
                }
            ]
        };

        if(data.plugins.privatechannels?.parentID) options.parent = data.plugins.privatechannels?.parentID;
    
        if(!channel) {
            const ch = await guild.channels.create(`Salon de ${member.user.username}`, options);

            if(!memberData) {
                const createUser = new PrivateChannel({ _id: require('mongoose').Types.ObjectId(), channelID: ch.id, ownerID: member.id });
                await createUser.save();
            } else {
                memberData.channelID = ch.id;
                await memberData.save();
            }

            await member.voice.setChannel(ch).catch(() => {});
        }
    } else if(memberData) {
        if(!newState.channelID || (newState.channelID !== memberData.channelID)) {
            if(oldChannel && oldChannel.members.size >= 1) {
                memberData.ownerID = oldChannel.members.random().id;
                await memberData.save();
            } else {
                await PrivateChannel.findOneAndDelete({ ownerID: member.id });
                if(channel) await channel.delete().catch(() => {});
            }
        }
    }
}
