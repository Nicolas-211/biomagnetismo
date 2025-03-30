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
// En tu backend (app.js)
app.use(cors({
  origin: [
    'http://localhost:5173', // Para desarrollo
    'https://biomagnetismo-front.vercel.app' // Cuando despliegues el front
  ]
}));
app.use(express.json());

// Endpoints
app.get('/api/pares', async (req, res) => {
  try {
    // 1. Buscar en todas las colecciones relevantes
    const colecciones = await mongoose.connection.db.listCollections().toArray();
    const nombresColecciones = colecciones.map(c => c.name);
    
    // 2. Buscar en cada colección el documento que contiene los pares
    let paresEncontrados = [];
    
    for (const nombreColeccion of nombresColecciones) {
      const documentos = await mongoose.connection.db.collection(nombreColeccion).find({}).toArray();
      
      // Buscar cualquier documento que tenga un array 'data' con contenido
      const documentoConData = documentos.find(doc => 
        doc.data && 
        Array.isArray(doc.data) && 
        doc.data.length > 0
      );
      
      if (documentoConData) {
        paresEncontrados = documentoConData.data;
        break; // Salir del bucle al encontrar los pares
      }
    }

    if (paresEncontrados.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron pares biomagnéticos',
        sugerencia: 'Verifica la estructura de la base de datos'
      });
    }

    // 3. Devolver solo los pares (opcional: filtrar campos)
    res.json(paresEncontrados.map(par => ({
      id: par.id,
      nombre: par.nombre,
      tipo: par.tipo,
      // ...otros campos que necesites
    })));

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      error: 'Error en el servidor',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get('/api/pares/:id', async (req, res) => {
  try {
    // 1. Buscar en todas las colecciones como lo hace /api/pares
    const colecciones = await mongoose.connection.db.listCollections().toArray();
    
    for (const { name: nombreColeccion } of colecciones) {
      const documentos = await mongoose.connection.db.collection(nombreColeccion).find({}).toArray();
      
      const documentoConData = documentos.find(doc => 
        doc.data && Array.isArray(doc.data) && doc.data.length > 0
      );
      
      if (documentoConData) {
        // Buscar el par específico en el array data
        const parEncontrado = documentoConData.data.find(par => par.id === req.params.id);
        
        if (parEncontrado) {
          return res.json(parEncontrado);
        }
      }
    }

    // Si no se encuentra
    const sampleIds = await getSampleIds();
    return res.status(404).json({ 
      error: 'Par no encontrado',
      idsDisponibles: sampleIds
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      error: 'Error en el servidor',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Función auxiliar para mostrar algunos IDs disponibles
async function getSampleIds() {
  const samplePares = await mongoose.connection.db.collection('pares')
    .find({}, { projection: { id: 1, _id: 0 } })
    .limit(5)
    .toArray();
  
  const samplePars = await mongoose.connection.db.collection('pars')
    .find({}, { projection: { id: 1, _id: 0 } })
    .limit(5)
    .toArray();

  return {
    enColeccionPares: samplePares.map(p => p.id),
    enColeccionPars: samplePars.map(p => p.id)
  };
}
app.listen(PORT, () => {
  console.log(`🚀 Backend listo en http://localhost:${PORT}`);
});
