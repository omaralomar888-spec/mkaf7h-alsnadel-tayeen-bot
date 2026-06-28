require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function missingEnv() {
  const required = ["TOKEN", "OWNER_ID", "REQUEST_CHANNEL_ID", "ADMIN_CHANNEL_ID", "IDS_CHANNEL_ID"];
  return required.filter((key) => !process.env[key]);
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const missing = missingEnv();
  if (missing.length) {
    console.log(`❌ Missing environment variables: ${missing.join(", ")}`);
  }

  // يرسل لوحة طلب التعيين تلقائياً أول ما يشتغل البوت
  // عشان ما يكررها كل مرة، غير AUTO_SEND_PANEL إلى false في Render بعد ما تنرسل اللوحة.
  if (process.env.AUTO_SEND_PANEL === "true") {
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
      console.log("✅ Panel sent successfully");
    } catch (error) {
      console.error("❌ Failed to send panel:", error);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === "open_tayeen_form") {
      const modal = new ModalBuilder()
        .setCustomId("tayeen_form")
        .setTitle("طلب تعيين");

      const yourName = new TextInputBuilder()
        .setCustomId("your_name")
        .setLabel("اسمك")
        .setPlaceholder("اكتب اسمك هنا")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const personName = new TextInputBuilder()
        .setCustomId("person_name")
        .setLabel("اسم الشخص")
        .setPlaceholder("اكتب اسم الشخص المرشح")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("سبب التعيين")
        .setPlaceholder("اكتب سبب التعيين")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const proof = new TextInputBuilder()
        .setCustomId("proof")
        .setLabel("رابط الدليل صورة أو مقطع")
        .setPlaceholder("حط رابط الصورة أو المقطع هنا")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(yourName),
        new ActionRowBuilder().addComponents(personName),
        new ActionRowBuilder().addComponents(reason),
        new ActionRowBuilder().addComponents(proof)
      );

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === "tayeen_form") {
      const yourName = interaction.fields.getTextInputValue("your_name");
      const personName = interaction.fields.getTextInputValue("person_name");
      const reason = interaction.fields.getTextInputValue("reason");
      const proof = interaction.fields.getTextInputValue("proof") || "لا يوجد";
      const requestId = `${interaction.user.id}_${Date.now()}`;

      const embed = new EmbedBuilder()
        .setTitle("📩 طلب تعيين جديد")
        .setColor("#8b5cf6")
        .addFields(
          { name: "مقدم الطلب", value: yourName, inline: true },
          { name: "حساب مقدم الطلب", value: `<@${interaction.user.id}>`, inline: true },
          { name: "اسم الشخص", value: personName, inline: true },
          { name: "سبب التعيين", value: reason },
          { name: "الأدلة", value: proof }
        )
        .setFooter({ text: `Request ID: ${requestId}` })
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_${requestId}`)
          .setLabel("قبول")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_${requestId}`)
          .setLabel("رفض")
          .setStyle(ButtonStyle.Danger)
      );

      const adminChannel = await client.channels.fetch(process.env.ADMIN_CHANNEL_ID);
      await adminChannel.send({ embeds: [embed], components: [buttons] });

      return interaction.reply({
        content: "✅ تم إرسال طلبك للإدارة.",
        ephemeral: true
      });
    }

    if (interaction.isButton() && interaction.customId.startsWith("accept_")) {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: "❌ ليس لديك صلاحية قبول الطلب.", ephemeral: true });
      }

      const idsChannel = await client.channels.fetch(process.env.IDS_CHANNEL_ID);
      const oldEmbed = interaction.message.embeds[0];

      const acceptedEmbed = EmbedBuilder.from(oldEmbed)
        .setTitle("✅ طلب تعيين مقبول")
        .setColor("#22c55e");

      const publicEmbed = EmbedBuilder.from(oldEmbed)
        .setTitle("📋 استبيان تعيين")
        .setDescription("تم قبول الطلب، الرجاء مراجعة بيانات التعيين بالأسفل.")
        .setColor("#22c55e");

      await idsChannel.send({
        content: "✅ **تم قبول طلب تعيين جديد**",
        embeds: [publicEmbed]
      });

      return interaction.update({
        content: "✅ تم قبول الطلب وإرساله إلى روم الايديات.",
        embeds: [acceptedEmbed],
        components: []
      });
    }

    if (interaction.isButton() && interaction.customId.startsWith("reject_")) {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: "❌ ليس لديك صلاحية رفض الطلب.", ephemeral: true });
      }

      const oldEmbed = interaction.message.embeds[0];
      const rejectedEmbed = EmbedBuilder.from(oldEmbed)
        .setTitle("❌ طلب تعيين مرفوض")
        .setColor("#ef4444");

      return interaction.update({
        content: "❌ تم رفض الطلب.",
        embeds: [rejectedEmbed],
        components: []
      });
    }
  } catch (error) {
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "صار خطأ، تأكد من صلاحيات البوت والرومات.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
