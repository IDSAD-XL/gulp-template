let project_folder = require('path').basename(__dirname);
let source_folder = '#src';
const { deepStrictEqual } = require('assert');
let fs = require('fs');

let path = {
	build: {
		html: project_folder + "/",
		css: project_folder + "/css/",
		js: project_folder + "/js/",
		img: project_folder + "/img/",
		fonts: project_folder + "/fonts/",
	},
	src: {
		html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
		css: source_folder + "/sass/style.sass",
		js: source_folder + "/js/common.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
		fonts: source_folder + "/fonts/*.ttf",
	},
	watch: {
		html: source_folder + "/**/*.html",
		css: source_folder + "/sass/*.sass",
		js: source_folder + "/js/**/*.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
	},
	clean: "./" + project_folder + "/",
	cleanFonts: "./" + source_folder + "/sass/_fonts.sass"
}

let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browsersync = require('browser-sync').create(),
	fileinclude = require("gulp-file-include"),
	clean_css = require("gulp-clean-css"),
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2'),
	fonter = require('gulp-fonter'),
	sass = require('gulp-sass'),                  //Подключение sass
	concat = require('gulp-concat'),              //Подключение конкатенации
	uglify = require('gulp-uglifyjs'),            //Подключение сжатия js
	cssnano = require('gulp-cssnano'),            //Подключение минификации css
	rename = require('gulp-rename'),              //Подключение переименования файлов
	del = require('del'),                         //Подключение удаления файлов
	imagemin = require('gulp-imagemin'),          //Подключение сжатия картинок
	pngquant = require('imagemin-pngquant'),      //Подключение для работы с png
	cache = require('gulp-cache'),                //Подключение кеширования
	autoprefixer = require('gulp-autoprefixer'),  //Подключение автопрефиксера 
	group_media = require('gulp-group-css-media-queries'),
	tildeImporter = require('node-sass-tilde-importer');

function browserSync(params) {
	browsersync.init({
		server: {
			baseDir: "./" + project_folder + "/"
		},
		port: 3000,
		notify: false
	});
}

function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream())
}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.build.js))
		.pipe(uglify())
		.pipe(
			rename({
				extname: ".min.js"
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream())
}

function css() {
	return src(path.src.css)
		.pipe(sass({
			importer: tildeImporter
		}))
		.pipe(group_media())
		.pipe(
			autoprefixer({
				overrideBrowserlist: ["last 5 versions"],
				cascade: true
			})
		)
		.pipe(dest(path.build.css))
		.pipe(clean_css())
		.pipe(
			rename({
				extname: ".min.css"
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
}

function images() {
	return src(path.src.img)
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3 // 0 to 7
			})
		)
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream())
}

function fonts() {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts));
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts));
}

gulp.task('otf2ttf', function () {
	return src([source_folder + "/fonts/*.otf"])
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(dest(source_folder + '/fonts/'))
})

function fontsStyle(params) {

	let file_content = fs.readFileSync(source_folder + '/sass/_fonts.sass');
	fs.writeFile(source_folder + '/sass/_fonts.sass', '', cb);
	return fs.readdir(path.build.fonts, function (err, items) {
		if (items) {
			let c_fontname;
			for (var i = 0; i < items.length; i++) {
				let fontname = items[i].split('.');
				fontname = fontname[0];
				if (c_fontname != fontname) {
					fs.appendFile(source_folder + '/sass/_fonts.sass', '@include font("' + fontname + '", "' + fontname + '", "400", "normal")\r\n', cb);
				}
				c_fontname = fontname;
			}
		}
	})
}

function cb() { }

function watchfiles(params) {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

function clean(params) {
	return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, html, css, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchfiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
