/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// jshint node: true
'use strict';

var dom5 = require('dom5');
var pred = dom5.predicates;

var inlineScriptFinder = pred.AND(
  pred.hasTagName('script'),
  pred.OR(
    pred.NOT(
      pred.hasAttr('type')
    ),
    pred.hasAttrValue('type', 'application/javascript')
  ),
  pred.NOT(
    pred.hasAttr('src')
  ),
  pred.NOT(
    pred.hasAttr('landing')
  )
);

var inlineStyleFinder = pred.AND(
  pred.hasTagName('style'),
  pred.OR(
    pred.NOT(
      pred.hasAttr('type')
    ),
    pred.hasAttrValue('type', 'text/css')
  ),
  pred.NOT(
    pred.hasAttr('landing')
  )
);

var externalScriptFinder = pred.AND(
  pred.hasTagName('script'),
  pred.hasAttr('src'),
  pred.OR(
    pred.NOT(
      pred.hasAttr('type')
    ),
    pred.hasAttrValue('type', 'text/javascript'),
    pred.hasAttrValue('type', 'application/javascript')
  ),
  pred.NOT(
    pred.hasAttr('landing')
  )
);

var externalStyleFinder = pred.AND(
  pred.hasTagName('link'),
  pred.hasAttrValue('rel', 'stylesheet'),
  pred.NOT(
    pred.hasAttr('landing')
  )
);

function split(source, jsFileName, cssFileName) {
  var doc = dom5.parse(source);
  var head = dom5.query(doc, pred.hasTagName('head'));
  var body = dom5.query(doc, pred.hasTagName('body'));
  var scripts = dom5.queryAll(doc, inlineScriptFinder);
  var styles = dom5.queryAll(doc, inlineStyleFinder);

  var jsContents = [];
  scripts.forEach(function(sn) {
    var nidx = sn.parentNode.childNodes.indexOf(sn) + 1;
    var next = sn.parentNode.childNodes[nidx];
    dom5.remove(sn);
    // remove newline after script to get rid of nasty whitespace
    if (next && dom5.isTextNode(next) && !/\S/.test(dom5.getTextContent(next))) {
      dom5.remove(next);
    }
    jsContents.push(dom5.getTextContent(sn));
  });

  var newScript = dom5.constructors.element('script');
  dom5.setAttribute(newScript, 'src', jsFileName);
  dom5.append(body, newScript);

  var styleContents = [];
  if (cssFileName) {
    styles.forEach(function(sn){
      var nidx = sn.parentNode.childNodes.indexOf(sn) + 1;
      var next = sn.parentNode.childNodes[nidx];
      dom5.remove(sn);
      // remove newline after style to get rid of nasty whitespace
      if (next && dom5.isTextNode(next) && !/\S/.test(dom5.getTextContent(next))) {
        dom5.remove(next);
      }
      styleContents.push(dom5.getTextContent(sn));
    })

    var newCss = dom5.constructors.element('link');
    dom5.setAttribute(newCss, 'rel', 'stylesheet');
    dom5.setAttribute(newCss, 'href', cssFileName);
    dom5.append(head, newCss);
  }

  var html = dom5.serialize(doc);
  // newline + semicolon should be enough to capture all cases of concat
  var js = jsContents.join('\n;');
  var style = styleContents.join('\n');

  return {
    html: html,
    js: js,
    style: style
  };
}

function splitDeps(source, all) {
  var doc = dom5.parse(source);
  var head = dom5.query(doc, pred.hasTagName('head'));
  var body = dom5.query(doc, pred.hasTagName('body'));
  var scripts = dom5.queryAll(doc, inlineScriptFinder);
  var styles = dom5.queryAll(doc, inlineStyleFinder);
  var jsFiles = dom5.queryAll(doc, externalScriptFinder);
  var cssFiles = dom5.queryAll(doc, externalStyleFinder);

  // split inline script
  var jsContents = [];
  scripts.forEach(function(sn) {
    var nidx = sn.parentNode.childNodes.indexOf(sn) + 1;
    var next = sn.parentNode.childNodes[nidx];
    dom5.remove(sn);
    // remove newline after script to get rid of nasty whitespace
    if (next && dom5.isTextNode(next) && !/\S/.test(dom5.getTextContent(next))) {
      dom5.remove(next);
    }
    jsContents.push(dom5.getTextContent(sn));
  });

  // split inline style
  var styleContents = [];
  styles.forEach(function(sn){
    var nidx = sn.parentNode.childNodes.indexOf(sn) + 1;
    var next = sn.parentNode.childNodes[nidx];
    dom5.remove(sn);
    // remove newline after style to get rid of nasty whitespace
    if (next && dom5.isTextNode(next) && !/\S/.test(dom5.getTextContent(next))) {
      dom5.remove(next);
    }
    styleContents.push(dom5.getTextContent(sn));
  })

  // parse external js and css, return a list
  var deps = {
    js: [],
    css: []
  }
  if (!all) {
    jsFiles = jsFiles.filter(function(sn){
      // filter third part js file
      if(dom5.getAttribute(sn, 'src').indexOf('://') > -1) {
        return false
      } else {
        return true
      }
    })
  }
  jsFiles.forEach(function(sn){
    var nidx = sn.parentNode.childNodes.indexOf(sn) + 1;
    var next = sn.parentNode.childNodes[nidx];
    dom5.remove(sn);
    // remove newline after style to get rid of nasty whitespace
    if (next && dom5.isTextNode(next) && !/\S/.test(dom5.getTextContent(next))) {
      dom5.remove(next);
    }
    deps.js.push(dom5.getAttribute(sn, 'src'))
  })
  if (!all) {
    cssFiles = cssFiles.filter(function(sn){
      if(dom5.getAttribute(sn, 'href').indexOf('://') > -1) {
        return false
      } else {
        return true
      }
    })
  }
  cssFiles.forEach(function(sn){
    var nidx = sn.parentNode.childNodes.indexOf(sn) + 1;
    var next = sn.parentNode.childNodes[nidx];
    dom5.remove(sn);
    // remove newline after style to get rid of nasty whitespace
    if (next && dom5.isTextNode(next) && !/\S/.test(dom5.getTextContent(next))) {
      dom5.remove(next);
    }
    deps.css.push(dom5.getAttribute(sn, 'href'))
  })


  var html = dom5.serialize(doc);
  // newline + semicolon should be enough to capture all cases of concat
  var js = jsContents.join('\n;');
  var style = styleContents.join('\n');

  return {
    html: html,
    js: js,
    style: style,
    deps: deps
  };
}

module.exports = {
  split: split,
  splitDeps: splitDeps
};
