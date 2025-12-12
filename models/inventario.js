const mongoose = require('mongoose');



const inventarioSchema = new mongoose.Schema({
  ID: Number,
  Producto: String,
  Ubicacion: String,
  Cantidad: Number,
}, { collection: 'Inventario' });




module.exports = mongoose.model('Inventario', inventarioSchema);