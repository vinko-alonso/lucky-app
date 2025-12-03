const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- Supabase Client ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// ---- Multer para recibir archivos ----
const upload = multer({ storage: multer.memoryStorage() });

// ---- Ruta para crear usuario ----
app.post("/usuarios", async (req, res) => {
  const { nombre } = req.body;

  const { data, error } = await supabase
    .from("usuarios")
    .insert([{ nombre }])
    .select();

  if (error) return res.status(500).json({ error });

  res.json(data[0]);
});

// ---- Subir imagen a Supabase Storage ----
app.post("/upload", upload.single("archivo"), async (req, res) => {
  const archivo = req.file;

  const nombreArchivo = `${Date.now()}-${archivo.originalname}`;

  const { error: uploadError } = await supabase.storage
    .from("imagenes")
    .upload(nombreArchivo, archivo.buffer, {
      contentType: archivo.mimetype,
    });

  if (uploadError) return res.status(500).json({ error: uploadError });

  // Obtener URL pública
  const { data } = supabase.storage.from("imagenes").getPublicUrl(nombreArchivo);
  const publicUrl = data.publicUrl;

  res.json({ url: publicUrl });
});

// ---- Guardar la URL en la tabla imagenes ----
app.get("/imagenes/:fileName", async (req, res) => {
  const { fileName } = req.params;

  const { data, error } = await supabase.storage
    .from("lucky-love-images")
    .createSignedUrl(fileName, 60 * 60); // 1 hora

  if (error) return res.status(500).json({ error });

  res.json({ url: data.signedUrl });
});

app.listen(process.env.PORT || 3000, () => console.log(`Servidor en puerto ${process.env.PORT || 3000}`));