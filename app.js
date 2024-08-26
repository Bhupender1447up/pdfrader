const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const app = express();
const port = 3000;
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
app.use(express.static(path.join(__dirname, "examples")));
// app.post('/upload', upload.single('pdf'), (req, res) => {
//     const filename = req.file.filename;

//     res.send({message:"File uploaded successfully",Filename:filename});
// });

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const filename = req.file.filename;
    const filePath = path.join(__dirname, "uploads", filename);

    // Load the existing PDF
    const pdfDoc = await PDFDocument.load(fs.readFileSync(filePath));

    // Embed the image to be added to the pages
    const img = await pdfDoc.embedPng(
      fs.readFileSync("./image/Thesis-profiles3 (1).png")
    );

    // Insert a new page at the beginning of the PDF
    const imagePageFront = pdfDoc.insertPage(0);
    imagePageFront.drawImage(img, {
      x: 0,
      y: 0,
      width: imagePageFront.getWidth(),
      height: imagePageFront.getHeight(),
    });
    const img2 = await pdfDoc.embedPng(
      fs.readFileSync("./image/Thesis-profiles1.png")
    );
    // Insert a new page at the end of the PDF
    const imagePageBack = pdfDoc.addPage(); // addPage() adds at the end
    imagePageBack.drawImage(img2, {
      x: 0,
      y: 0,
      width: imagePageBack.getWidth(),
      height: imagePageBack.getHeight(),
    });

    // Save the modified PDF to a new file
    const pdfBytes = await pdfDoc.save();
    const newFilePath = path.join(
      __dirname,
      "uploads",
      `${path.basename(filePath, ".pdf")}-result.pdf`
    );
    fs.writeFileSync(newFilePath, pdfBytes);

    // Respond with the new file details
    res.send({
      message: "File uploaded and modified successfully",
      Filename: newFilePath,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "An error occurred while processing the PDF." });
  }
});

// Serve the HTML form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "examples", "index.html"));
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
