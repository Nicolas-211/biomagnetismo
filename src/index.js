import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Render usa 10000

// Conexión a MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://nicolasnanjari:RzAaonXFR3Bfzi9r@cluster0.fx44go1.mongodb.net/biomagnetismo?retryWrites=true&w=majority';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error de conexión:', err));

// Modelo del Par Biomagnético
const ParSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: String,
  zona: String,
  PATOGENO: String,
  PAR_GOIZ: String,
  PUNTO_APLICACIÓN_1: String,
  PUNTO_APLICACIÓN_2: String,
  enfermedad: String,
  info_adicional: String
});

const Par = mongoose.model('Par', ParSchema);

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Endpoints
app.get('/api/pares', async (req, res) => {
  try {
    const pares = await Par.find().sort({ nombre: 1 });
    res.json(pares);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar pares' });
  }
});

app.get('/api/pares/:id', async (req, res) => {
  try {
    const par = await Par.findById(req.params.id);
    if (!par) return res.status(404).json({ error: 'Par no encontrado' });
    res.json(par);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar el par' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend listo en http://localhost:${PORT}`);
});