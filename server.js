const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify({ products: seedProducts, orders: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDB(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
const seedProducts = [
  {id:1,name:"Smartphone Android 128GB",category:"Eletrônicos",price:899.90,oldPrice:1099.90,emoji:"📱",description:"Smartphone com 128GB de armazenamento.",stock:15},
  {id:2,name:"Fone Bluetooth sem fio",category:"Eletrônicos",price:119.90,oldPrice:159.90,emoji:"🎧",description:"Fone sem fio com estojo de carregamento.",stock:30},
  {id:3,name:"Tênis esportivo casual",category:"Moda",price:179.90,oldPrice:229.90,emoji:"👟",description:"Tênis confortável para o dia a dia.",stock:20},
  {id:4,name:"Relógio digital",category:"Acessórios",price:89.90,oldPrice:129.90,emoji:"⌚",description:"Relógio digital de visual moderno.",stock:12},
  {id:5,name:"Mochila para notebook",category:"Acessórios",price:139.90,oldPrice:179.90,emoji:"🎒",description:"Mochila com compartimento para notebook.",stock:18},
  {id:6,name:"Cafeteira elétrica",category:"Casa",price:149.90,oldPrice:189.90,emoji:"☕",description:"Cafeteira prática para sua cozinha.",stock:9},
  {id:7,name:"Bola de futebol",category:"Esportes",price:79.90,oldPrice:99.90,emoji:"⚽",description:"Bola para lazer e treino.",stock:25},
  {id:8,name:"Kit de cuidados pessoais",category:"Beleza",price:59.90,oldPrice:79.90,emoji:"🧴",description:"Kit para cuidados diários.",stock:40}
];

app.get("/api/products", (req, res) => {
  const db = readDB();
  const q = String(req.query.q || "").toLowerCase();
  const category = String(req.query.category || "");
  res.json(db.products.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
    (!category || category === "Todos" || p.category === category)
  ));
});

app.post("/api/products", (req, res) => {
  const { name, category, price, stock, emoji, description } = req.body;
  if (!name || !category || !Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: "Informe nome, categoria e preço válido." });
  }
  const db = readDB();
  const product = {
    id: Date.now(), name: String(name), category: String(category),
    price: Number(price), oldPrice: null, stock: Math.max(0, Number(stock) || 0),
    emoji: String(emoji || "📦"), description: String(description || "")
  };
  db.products.unshift(product);
  writeDB(db);
  res.status(201).json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const db = readDB();
  const before = db.products.length;
  db.products = db.products.filter(p => p.id !== Number(req.params.id));
  if (db.products.length === before) return res.status(404).json({error:"Produto não encontrado."});
  writeDB(db);
  res.json({ ok: true });
});

app.post("/api/orders", (req, res) => {
  const { customer, items, payment, address } = req.body;
  if (!customer || !items?.length || !payment || !address) {
    return res.status(400).json({error:"Dados do pedido incompletos."});
  }
  const db = readDB();
  const order = {
    id: "SHP" + Date.now(), customer, items, payment, address,
    status: "Aguardando confirmação de pagamento",
    createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  writeDB(db);
  res.status(201).json(order);
});

app.get("/api/orders", (req, res) => res.json(readDB().orders));

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`SHOPEEFY disponível em http://localhost:${PORT}`));
