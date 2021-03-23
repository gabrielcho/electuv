const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require('dotenv').config();
const models = require('./models');
const Op = models.Sequelize.Op;

const cookieSession = require('cookie-session');


const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
       models.User.findOrCreate({
         googleid: profile.id, name: profile.givenName, admin: false},
         function (err, user) {
         return done(err, user);
       });
  }
));



//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//cookie-session middleware
app.use(cookieSession({
    name:'electuv-session',
    keys: [KEY1, KEY2]
}));

//request body parsing
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

// .destroy to delete rows
async function deleteReview(reviewId) {
    let rowsdeleted = 0;
    await models.Review.destroy({where: {id:reviewId}})
    .then((result) =>  rowsdeleted = result)
    .catch((err) => console.error(err));
    return rowsdeleted;
}

async function getReviews(courseId) {
    let reviews = [];
    await models.Review.findAll({where: {courseid:courseId}})
    .then((reviewList) => reviews = reviewList)
    .catch((err) => console.error(err));
    return reviews;
}

passport.serializeUser((user, done) => {
    
    done(null, user.id);
})

passport.deserializeUser(() => {});



//passport authentication routes
app.get('/auth/google', passport.authenticate('google', {scope: 'profile'}), (req, res) => {
    
});

app.get('/auth/google/auth/', passport.authenticate('google', { failureRedirect: '/authfallido' }), (req, res) => {
    res.redirect('/');
});

//root route ('homepage')
app.get('/', (req, res) => res.send('ElectUV'));


//postcourse route //dev only
app.post('/postcourse', async(req, res) => {
    let courseId =  await createCourse(req.body);
    res.send(courseId);
})

//cursos route
//sends all the courses available in a JSON list
app.get('/cursos', async (req, res) => {
   //should set the response as a JSON list
    await models.Course.findAll()
        .then((courses) => res.status(200).send(courses))
        .catch((err) => res.status(400).send('error de comunicación con la base de datos'));
});



/*
Reviews route.
+ (DONE) Should return the reviews list of the corresponding course 
+ (DONE) Should inform by response if there is no course with the corresponding courseid
*/
app.get('/reviews/:courseid', async(req, res) => {
    //let userId = req.user.id;
    let courseId = req.params.courseid;
    let reviews = null;

     if (await models.Course.findByPk(courseId)){
        await getReviews(courseId).then((reviewList) => reviews =  reviewList.foreach((review) => {
            //if we find a vote that has the user ID and the current review ID we will place its value
            let userVote = models.Vote.findOne({ //Here we have to fetch the database to know if the user has voted on any of the reviews
                where: {userid: userId, reviewid: review.id}
            });
            if(userVote){
                return {...review, vote: userVote }
            }
            else{
                return {...review, vote: 0}
            }
            
        } ))
        .catch((err) => console.log(err));
     }
    
    if(reviews){
        res.status(200).send(reviews);
    }
    else{
        res.status(400).send('El curso al que intentas acceder no existe.')
    }

});

//publicarreview Review route
// + Should include authenticate middleware (NOT YET)
// + Should not post the review if the user has already posted one
app.post('/publicarreview', async (req, res) => {
    let reviewId = await postReview({...req.body, userid:1} ); //En esta linea userid debe ser en realidad req.user.id
    res.send(reviewId);                                        //- así que esto es por testing

});

/*   eliminarreview route
should include authentication middleware
It deletes a review from the database
If the review ID is not from the authenticated use
*/
app.delete('/eliminarreview/:id', async(req,res) => {
    let reviewId = req.params.id;

    //First it has to check if the review was created by the user
    //If not, the code from below will not be executed
    await deleteReview(reviewId)
    .then( (rowsDeleted) => {
        rowsDeleted > 0 ? 
        res.status(200).send('Se eliminó la review de la base de datos') 
        : res.status(406).send('La review que intentas eliminar ya no existe')
    });

});

/* votarreview route
    it checks if the user has already voted 
*/

/*     Auth routes
These routes are used to authenticate the user and let him use protected routes
*/ 
// app.get('/auth/google');
// app.get('/logout');
// app.get('/auth/google/callback');




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

