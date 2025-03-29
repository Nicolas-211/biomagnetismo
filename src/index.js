import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Render usa 10000

// Conexión a MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://nicolasnanjari:RzAaonXFR3Bfzi9r@cluster0.fx44go1.mongodb.net/biomagnetismo?retryWrites=true&w=majority';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error de conexión:', err));

// Modelo del Par Biomagnético
const ParSchema = new mongoose.Schema({
  id: String, // Se agregó para mantener coherencia con los datos
  nombre: { type: String, required: true },
  tipo: String,
  zona: String,
  PATOGENO: String,
  PAR_GOIZ: String,
  PUNTO_APLICACIÓN_1: String,
  PUNTO_APLICACIÓN_2: String,
  enfermedad: String,
  info_adicional: String
}, { collection: 'pares' }); // Se especifica el nombre exacto de la colección

const Par = mongoose.model('pares', ParSchema);

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());

// Endpoints
app.get('/api/pares', async (req, res) => {
  try {
    // Busca en todas las colecciones posibles
    const [pares, pars, biomagnetismo] = await Promise.all([
      mongoose.connection.db.collection('pares').find({}).toArray(),
      mongoose.connection.db.collection('pars').find({}).toArray(),
      mongoose.connection.db.collection('biomagnetismo').find({}).toArray()
    ]);

    const resultados = [...pares, ...pars, ...biomagnetismo];
    
    if (resultados.length === 0) {
      return res.status(404).json({ error: 'No se encontraron pares en ninguna colección' });
    }

    res.json(resultados);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📌 Colecciones encontradas:", collections); // Debug
    res.json(collections);
  } catch (err) {
    console.error('❌ Error al listar colecciones:', err);
    res.status(500).json({ error: 'Error en la consulta' });
  }
});

app.get('/api/pares/:id', async (req, res) => {
  try {
    const par = await Par.findOne({ id: req.params.id }); 
    if (!par) return res.status(404).json({ error: 'Par no encontrado' });
    res.json(par);
  } catch (err) {
    console.error('❌ Error al cargar el par:', err);
    res.status(500).json({ error: 'Error al cargar el par' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Backend listo en http://localhost:${PORT}`);
});
