const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const path = require("path");
const dataBaseUsers = require("../dataBase/userList.json");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderToSave = path.join(__dirname, '..', '..', 'public', 'images', 'users');
        cb(null, folderToSave);
    // cb(null, "public/images/users");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const authController = {
  profile: (req, res) => {
    res.render("users/profile");
  },

  login: (req, res) => {
    res.render("users/login");
  },

  register: (req, res) => {
    res.render("users/register", { errors: [] });
  },

  rr: (req, res) => {
    res.send("este funciona!");
  },

  doRegister: (req, res) => [
    upload.single("img"),
    async (req, res) => {
      console.log("llegué aca al doregister");
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.render("users/register", { errors: errors.array() });
      }

      const { name, lastName, email, password } = req.body;
      const userImage = req.file;

      // Encriptar la contraseña con bcrypt
      const hashedPassword = bcrypt.hashSync(password, 10);

      // const imagePath = userImage ? `/usersImage/${userImage.filename}` : "";
      const imagePath = userImage ? `/images/users/${userImage.filename}` : "";

      const newUserId =
        dataBaseUsers.user.length > 0
          ? parseInt(dataBaseUsers.user[dataBaseUsers.user.length - 1].id) + 1
          : 1;

      const newUser = {
        id: newUserId.toString(),
        type: "user",
        name,
        lastName,
        email,
        password: hashedPassword, // Usar la contraseña encriptada
        img: imagePath,
      };

      dataBaseUsers.user.push(newUser);

      fs.writeFileSync(
        path.join(__dirname, "../dataBase/userList.json"),
        JSON.stringify(dataBaseUsers, null, 4)
      );

      res.redirect("/user/login");
    },
  ],

  // doRegister: (req, res) => [
  //   // upload.single("img"),
  //   // [
  //   //   body("name").notEmpty().withMessage("El campo nombre es obligatorio"),
  //   //   body("lastName")
  //   //     .notEmpty()
  //   //     .withMessage("El campo apellido es obligatorio"),
  //   //   body("email")
  //   //     .isEmail()
  //   //     .withMessage("El campo correo electrónico no es válido"),
  //   //   body("password")
  //   //     .notEmpty()
  //   //     .withMessage("El campo contraseña es obligatorio"),
  //   //   body("img").custom((value, { req }) => {
  //   //     if (!req.file) {
  //   //       throw new Error("La imagen es obligatoria");
  //   //     }
  //   //     return true;
  //   //   }),
  //   // ],
  //   async (req, res) => {
  //     console.log("llegué aca al doregister");
  //     const errors = validationResult(req);

  //     if (!errors.isEmpty()) {
  //       return res.render("users/register", { errors: errors.array() });
  //     }

  //     const { name, lastName, email, password } = req.body;
  //     const userImage = req.file;

  //     // Encriptar la contraseña con bcrypt
  //     const hashedPassword = await bcrypt.hash(password, 10);

  //     // const imagePath = userImage ? `/usersImage/${userImage.filename}` : "";
  //     const imagePath = userImage ? `/images/users/${userImage.filename}` : "";

  //     const newUserId =
  //       dataBaseUsers.user.length > 0
  //         ? parseInt(dataBaseUsers.user[dataBaseUsers.user.length - 1].id) + 1
  //         : 1;

  //     const newUser = {
  //       id: newUserId.toString(),
  //       type: "user",
  //       name,
  //       lastName,
  //       email,
  //       password: hashedPassword, // Usar la contraseña encriptada
  //       img: imagePath,
  //     };

  //     dataBaseUsers.user.push(newUser);

  //     fs.writeFileSync(
  //       path.join(__dirname, "../dataBase/userList.json"),
  //       JSON.stringify(dataBaseUsers, null, 4)
  //     );

  //     res.redirect("/user/login");
  //   },
  // ],

  doLogin: async (req, res) => {
    const { email, password } = req.body;

    // Buscar el usuario en la base de datos
    const usuario = dataBaseUsers.user.find((user) => user.email === email);

    if (usuario) {
      // Verificar la contraseña con bcrypt
      const contraseñaValida = await bcrypt.compare(password, usuario.password);

      if (contraseñaValida) {
        // Almacenar el ID del usuario en la sesión
        req.session.userId = usuario.id;

        // Redirigir a la página principal con un mensaje de éxito
        return res.redirect("/?mensaje=¡Enhorabuena, iniciaste sesión!");
      } else {
        // Credenciales incorrectas
        return res.send("Credenciales incorrectas");
      }
    } else {
      // Credenciales incorrectas
      return res.send("Credenciales incorrectas");
    }
  },
  doLogout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Error al cerrar sesión");
      }
      res.redirect("/login"); // Puedes redirigir a donde quieras después del cierre de sesión
    });
  },
};

module.exports = authController;
