const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
//const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const WebWhatsappProvider = require('@bot-whatsapp/provider/web-whatsapp')
const MongoAdapter = require('@bot-whatsapp/database/mongo');
const QRPortalWeb = require('@bot-whatsapp/portal');




const connectDB = require('./db');
const Inventario = require('./models/inventario');
const Solicitud = require('./models/solicitud');


connectDB();

//Inicio del Bot

const flowPrincipal = addKeyword(['hola', 'buenas', 'hey', 'saludos', 'ola', 'quiuvo', 'que tranza'])
  .addAnswer(
    'Hola, bienvenido al sistema de inventario CIDEM.\nDeseas consultar o solicitar un material?',
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic }) => {
      const respuesta = ctx.body.toLowerCase().trim();

      if (respuesta.includes('consultar')) {
        return gotoFlow(flowConsultar);
      } else if (respuesta.includes('solicitar')) {
        return gotoFlow(flowSolicitar);
      } else {
        await flowDynamic('No entendi tu respuesta. Por favor escribe consultar o solicitar.');
      }
    }
  );


//Solicitud

const flowSolicitar = addKeyword(['solicitar'])
  .addAnswer('Cual es tu nombre?', { capture: true }, async (ctx, { state }) => {
    await state.update({ nombre: ctx.body.trim() });
  })
  .addAnswer('Que material deseas solicitar?', { capture: true }, async (ctx, { state }) => {
    await state.update({ material: ctx.body.trim() });
  })
  .addAnswer('Que cantidad necesitas?', { capture: true }, async (ctx, { state }) => {
    await state.update({ cantidad: ctx.body.trim() });
  })
  .addAnswer('Registrando tu solicitud', null, async (ctx, { flowDynamic, state }) => {
    try {
      const datos = state.getMyState();
      const telefono = ctx.from || ctx.sender || ctx.phone;

      await Solicitud.create({
        nombreSolicitante: datos.nombre,
        telefono: telefono,
        material: datos.material,
        cantidad: datos.cantidad
      });

      await flowDynamic(
        `Solicitud registrada correctamente.\n\n` +
        `Nombre: ${datos.nombre}\n` +
        `Telefono: ${telefono}\n` +
        `Material: ${datos.material}\n` +
        `Cantidad: ${datos.cantidad}\n` +
        `Fecha: ${new Date().toLocaleString()}`
      );
    } catch (error) {
      console.log(error);
      await flowDynamic('Error al registrar la solicitud.');
    }
  });


  //Consulta
const flowConsultar = addKeyword(['consultar', 'buscar', 'ver', 'inventario'])
  .addAnswer('Que material deseas buscar?', { capture: true }, async (ctx, { flowDynamic }) => {
    const material = ctx.body.trim();
    try {
      const item = await Inventario.findOne({
        Producto: { $regex: new RegExp(material, 'i') }
      });
      if (!item) {
        await flowDynamic(`No se encontro "${material}" en el inventario.`);
      } else {
        await flowDynamic(`Se cuenta con ${item.Cantidad} ${item.Producto} en la ubicacion ${item.Ubicacion}.`);
      }
    } catch (error) {
      await flowDynamic('Ocurrio un error al consultar el inventario.');
    }
  });







const main = async () => {
  const adapterDB = new MongoAdapter({
    dbUri: 'mongodb://localhost:27017/CIDEM_Inventario',
    dbName: 'CIDEM_Inventario',
  });

  const adapterFlow = createFlow([flowPrincipal, flowConsultar, flowSolicitar]);
  const adapterProvider = createProvider(WebWhatsappProvider)
  //const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};


main();
