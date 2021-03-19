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

    let courseId = 'invalid';
    await models.Course.create({
        coursecode: jsoncourse.coursecode,
        coursename: jsoncourse.coursename,
        description: jsoncourse.description,
        rating: jsoncourse.rating,
        faculty: jsoncourse.faculty
    })
    .then((id) => courseId = id)
    .catch((err) => console.log(err));

    return courseId;
}

/* 
{
    ### This is how it would look a JSON sent from the Client Side

    title: 'tremenda materia, me encantó',
    teacher: "Fuam fuam",
    period: '2021-1,
    content: 'El único profesor que se ha esforzado en enseñarme algo'

    The request agent has to be authenticated before any operation could occur
};
*/
async function postReview(jsonreview){
    let reviewId = 'invalid';
    await models.Review.create({
        userid: jsonreview.userid,
        courseid:jsonreview.courseid,
        title: jsonreview.title,
        teacher: jsonreview.teacher,
        period: jsonreview.period,
        content: jsonreview.content
    })
    .then((id) => reviewId = id)
    .catch((err) => console.error(err) );

    return reviewId;
}


//postcourse route
app.post('/postcourse', (req, res) => {
    let courseId =  createCourse(req.body);
    res.send(courseId);
})

app.get('/', (req, res) => res.send('ElectUV'));

//cursos route
//sends all the courses available in a JSON list
app.get('/cursos', async (req, res) => {
   //should set the response as a JSON list
    let courses = await models.Course.findAll();
    res.send(courses);
});


//Reviews route
app.get('/reviews/:id', (req, res) => {
    //should return the reviews of the corresponding course 
});

//publicarreview Review route
//Should include authenticate middleware (NOT YET)
app.post('/publicarreview', async (req, res) => {
    let idReview = await postReview({...req.body, userid:1} ); //En esta linea userid debe ser en realidad req.user.id
    res.send(idReview);                                        //- así que esto es por testing

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

