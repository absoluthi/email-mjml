const gulp = require('gulp');
const mjml = require('gulp-mjml');
const sass = require('gulp-sass');
const rename = require("gulp-rename");
const mjmlEngine = require('mjml');
const jsonReplace = require('gulp-json-replace');
const injectString = require('gulp-inject-string');
const sendEmail = require('gulp-mail');
const contains = require('gulp-contains');

//set up do SMTP
let smtpInfo = {
  auth: {
    user: 'contato@bliteti.com.br',
    pass: 'Blite@2018'
  },
  host: 'smtp.bliteti.com.br',
  secureConnection: false,
  port: 587
};
//infos necessárias pro envio do e-mail
let emailInfos = {
  subject: 'E-mail teste - conf',
  to: [
    'thiago.bliteti@outlook.com',
    'thiago.bliteti@yahoo.com',
    'thiagoqcaetano@gmail.com',
    'thiago.caetano@bliteti.com.br'
  ],
  from: 'contato@bliteti.com.br',
  smtp: smtpInfo
}

gulp.task('mjml-compile:all', function() {
  return gulp.src('./src/*.mjml')
  .pipe(mjml())
  .pipe(gulp.dest('./dist'))
});

gulp.task('mjml-compile:min', function() {
  //TODO: pesquisar/descobrir por que ele da erro na parte da minificação
  //TODO: alternativa caso não fuincione
  //tentar usar um minificador padrão de HTML que não remove os comentários condicionais ou as coisas necessarias
  return gulp.src('./src/*.mjml')
  .pipe(mjml(mjmlEngine, {minify: true}))
  .pipe(gulp.dest('./dist/'))
})

gulp.task('replace-var:mock', function(){
  return gulp.src(['./dist/*.html', '!./dist/*.mock.html'])
  .pipe(jsonReplace({
    src: "./variables.json",
    identify: '@'
  }))
  .pipe(rename({
    suffix : ".mock"
  }))
  .pipe(gulp.dest('./build/'));
  //TODO: preciso achar um jeito de não precisar colocar arquivos por arquivo nas variaveis, repetindo o json e aumentando a lista
  // talvez usando outro plugin do gulp
})

gulp.task('inject-string:header', function(){
  return gulp.src('./dist/*.html')
  .pipe(injectString.before('<head>', '<head><!-- Yahoo App Android will strip this --></head>'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('send-email:all', function (cb) {
  return gulp.src('./dist/*.mock.html')
  .pipe(sendEmail(emailInfos));
  //TODO: explorar parametros no cmd pra gerar e/ou enviar arquivos específicos
});

gulp.task('sass:all', function () {
  //TODO: aceitar arquivos sass ou scss
  return gulp.src('./assets/sass/**/*.sass')
  .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
  .pipe(gulp.dest('./assets/css/'));
});

gulp.task('migrate-styles', function(){
  return gulp.src('./assets/css/*.css')
  .pipe(rename({
    extname: '.mjml'
  }))
  .pipe(gulp.dest('./src/includes/'))
});

gulp.task('inject-string:styles', function () {
  return gulp.src('./src/includes/*.mjml', '!./src/includes/*-mob.mjml')
  .pipe(injectString.replace('<mj-style>', ''))
  .pipe(injectString.replace('<mj-style inline="inline">', ''))
  .pipe(injectString.replace('</mj-style>', ''))
  .pipe(injectString.wrap('<mj-style inline="inline">', '</mj-style>'))
  .pipe(gulp.dest('./src/includes/'));
  });
  gulp.task('inject-string:styles_mob', function () {
    return gulp.src('./src/includes/*-mob.mjml')
    .pipe(injectString.replace('<mj-style>', ''))
    .pipe(injectString.replace('<mj-style inline="inline">', ''))
    .pipe(injectString.replace('</mj-style>', ''))
    .pipe(injectString.wrap('<mj-style>', '</mj-style>'))
    .pipe(gulp.dest('./src/includes/'));
});

/* ----------  watch tasks ----------*/
gulp.task('watch:mjml', function () {
  gulp.watch('./src/**/*.mjml', gulp.series(['default']));
})
gulp.task('watch:styles', function () {
  //TODO: aceitar arquivos sass ou scss
  gulp.watch('./assets/sass/**/*.sass', gulp.series(['styles']));
})
/* ----------  end watch tasks ----------*/

/* ----------  complete tasks ----------*/
gulp.task('default', gulp.series(['mjml-compile:all', 'inject-string:header', 'replace-var:mock']));
gulp.task('styles', gulp.series(['sass:all', 'migrate-styles', 'inject-string:styles', 'inject-string:styles_mob']));
gulp.task('test', gulp.series(['default', 'styles', 'send-email:all']));
/* ----------  end complete tasks ----------*/

//TODO: um arquivo de config, pra passar os emails que vão ser usados nos testes.