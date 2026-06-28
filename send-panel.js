require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  try {
    const channel = await client.channels.fetch(process.env.REQUEST_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("📋 طلب تعيين")
      .setDescription("اضغط على الزر بالأسفل لتقديم طلب تعيين.")
      .setColor("#8b5cf6");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_tayeen_form")
        .setLabel("طلب تعيين")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
    console.log("✅ تم إرسال لوحة طلب التعيين");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(process.env.TOKEN);
