const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const dotenv = require('dotenv');

app.get('/', (req, res) => res.send('ElectUV'));


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

