const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi database (membuat tabel & seed admin jika perlu)
require("./database/database");

const authRoutes = require("./routes/auth");
const pasienRoutes = require("./routes/pasien");
const adminRoutes = require("./routes/admin");
const displayRoutes = require("./routes/display");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "queuecare-secret",
    resave: false,
    saveUninitialized: false
}));

app.use("/", authRoutes);
app.use("/", pasienRoutes);
app.use("/", adminRoutes);
app.use("/", displayRoutes);

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
