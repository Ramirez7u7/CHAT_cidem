const mongoose = require('mongoose');



const SolicitudSchema = new mongoose.Schema({
  nombreSolicitante: { type: String, required: true },
  telefono: { type: String, required: true },
  material: { type: String, required: true },
  cantidad: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});



module.exports = mongoose.model('solicitud', SolicitudSchema);