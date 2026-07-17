const bcrypt = require("bcryptjs");
const db = require("../database/database");

// Menampilkan halaman login
exports.showLogin = (req, res) => {
    res.render("login", { error: null, registered: req.query.registered === "1" });
};

// Menampilkan halaman register
exports.showRegister = (req, res) => {
    res.render("register", { error: null });
};

// Proses register
exports.register = async (req, res) => {

    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
        return res.render("register", { error: "Semua kolom wajib diisi." });
    }

    try {
        const hashPassword = await bcrypt.hash(password, 10);
        db.prepare(
            "INSERT INTO users (nama, email, password) VALUES (?, ?, ?)"
        ).run(nama, email, hashPassword);

        res.redirect("/login?registered=1");
    } catch (err) {
        res.render("register", { error: "Email sudah digunakan, silakan pakai email lain." });
    }
};

// Proses login
exports.login = async (req, res) => {

    const { email, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
        return res.render("login", { error: "Email tidak ditemukan.", registered: false });
    }

    const cocok = await bcrypt.compare(password, user.password);

    if (!cocok) {
        return res.render("login", { error: "Password salah.", registered: false });
    }

    req.session.user = {
        id: user.id,
        nama: user.nama,
        role: user.role
    };

    if (user.role === "admin") {
        return res.redirect("/admin");
    }

    res.redirect("/dashboard");
};

// Proses logout
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};
