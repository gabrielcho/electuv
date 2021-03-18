const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require('dotenv');
const models = require('./models');
const Op = models.Sequelize.Op;



app.use(express.json());
app.use(express.urlencoded());



/* example json
{
        coursecode: '710252M',
        coursename: 'ROBOTS ENTRE LA HISTORIA Y LA FICCIÓN',
        description: 'Este curso se encarga de explicar el desarrollo del paralelo entre los robots reales y ficticios.',
        rating: 100,
        faculty: 'Humanidades'
}
*/

async function createCourse(jsoncourse){
    let courseid
    await models.Course.create({
        coursecode: jsoncourse.coursecode,
        coursename: jsoncourse.coursename,
        description: jsoncourse.description,
        rating: jsoncourse.rating,
        faculty: jsoncourse.faculty
    })
    .then((id) => courseid = id)
    .catch((err) => console.log(err));

    return courseid;
}


//postcourse route
app.post('/postcourse', (req, res) => {
    let courseid = createCourse(req.body);
    res.send(courseid);
})

app.get('/', (req, res) => res.send('ElectUV'));

//cursos route
//sends all the courses available in a JSON list
app.get('/cursos', (req, res) => {
   //should set the response as a JSON list

});


//Reviews route
app.get('/reviews/:id', (req, res) => {
    //should return the reviews of the corresponding course 
});

//publicar Review route
//Should include authenticate middleware,
app.post('/publicar', (req, res) => {

});

/*   eliminarreview route
should include authentication middleware
It deletes a review from the database
If the review ID is not from the authenticated use
*/
app.delete('/eliminarreview/:id', (req,res) => {

});

/*     Auth routes
These routes are used to authenticate the user and let him use protected routes
*/ 
// app.get('/auth/google');
// app.get('/logout');
// app.get('/auth/google/callback');




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

