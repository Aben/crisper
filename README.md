# Crisper
> Split scripts and styles from an HTML file for CSP compliance
> Add attribute `landing` will keep it in HTML file 

## Usage

    cat index.html | crisper -h build.html -j build.js -c build.css
    crisper --source index.html --html build.html --js build.js --css build.css

or

    crisper --source index.html --deps build --all

## API

### split(source, jsFileName[, cssFileName])

Split inline scripts and styles, return an object.

    {
      html: 'html string',
      js: 'js string',
      style: 'style string'
    }

### splitDeps(source, all=false)

Split inline scripts and inline styles return string, parse external scripts and external styles return path.
`all=false` that will fail through a file with uri, like `https://code.jquery.com/jquery-2.1.4.min.js`,
set `true` pass through. lower than the `landing` attribute.
  
    {
      html: 'html string'
      js: 'inline js string'
      style: 'inline style string'
      deps: {
        js: ['js/foo.js', 'js/bar.js']
        css: ['css/common.css']
      }
    }

