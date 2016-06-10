var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var tsify = require('tsify');
var gutil = require('gulp-util');
var babelify = require('babelify');
var browsersync = require('browser-sync').create();
var less = require('gulp-less');

var paths = {
	html : ['src/*.html'],
	assets: ['src/*.html', 'src/images/*', 'src/vendor/*.js'],
	less: ['src/less/index.less'],
	watch: ['src/*.html', 'src/images/*', 'src/vendor/*.js', 'src/cio/**/*.ts'],

};

gulp.task('serve', function(){
	browsersync.init({
		server: './dist/',
		open: true
	});
});

var watchedBrowserify = watchify(browserify({
	basedir: '.',
	debug: true,
	entries: ['src/main.ts'],
	cache: {},
	packageCache: {}
})
	.plugin(tsify, { target: 'es6' })
	.transform(babelify, {extensions: [ '.ts' ]}));


gulp.task('less', function () {
	return gulp.src(paths.less)
		.pipe(less())
		.pipe(gulp.dest('dist/css'))
});

gulp.task('build', ['copy-files', 'less'], function () {
	browserify({
		basedir: '.',
		debug: true,
		entries: ['src/main.ts'],
		cache: {},
		packageCache: {}
	})
	.plugin(tsify, { target: 'es6' })
	.transform(babelify, {extensions: [ '.ts' ]})
	.bundle()
	.pipe(source('bundle.js'))
	.pipe(gulp.dest('dist'));
});

gulp.task('copy-files', function () {
	return gulp.src(paths.assets, {base: './src'}).pipe(gulp.dest('dist'));
});

gulp.task("copy-html", function () {
	return gulp.src(paths.html, {base: './src'}).pipe(gulp.dest('dist'));
});

gulp.task('sync', ['copy-files', 'less'], function () {
	var watcher = gulp.watch(paths.watch.concat(paths.less), ['copy-files', 'less', 'reload']);
	return browsersync.init({
		server: './dist/',
		open: true,
		injectChanges: true
	});
});

gulp.task('reload', function(){
	browsersync.reload();
});

function bundle() {
	//browsersync.reload();
	return watchedBrowserify
		.bundle()
		.pipe(source('bundle.js'))
		.pipe(gulp.dest('dist'));
}

gulp.task('default', ['copy-files', 'less', 'sync'], bundle);

gulp.task('dev', ['sync'], bundle);

watchedBrowserify.on('update', bundle);

watchedBrowserify.on('log', gutil.log);


