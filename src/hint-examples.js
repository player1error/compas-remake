'use strict';

// Examples illustrate the rule with independent code.
module.exports = Object.freeze({
 'html-attribute-separator': '<a href="/about">About</a>',
 'html-attribute-assignment': '<a href="/about">About</a>',
 'html-attribute-quote': '<button type="button">Open</button>',
 'html-duplicate-id': '<h2 id="intro">Intro</h2>\n<h2 id="summary">Summary</h2>',
 'html-tag-close': '<section>Content</section>',
 'html-nesting': '<section><p>Content</p></section>',
 'css-colonexpected': '.tile { padding: 8px }',
 'css-semicolonexpected': '.tile { padding: 8px; margin: 4px }',
 'css-lcurlyexpected': '.tile { padding: 8px }',
 'css-rcurlyexpected': '.tile { padding: 8px }',
 'css-unit': '.tile { padding: 8px }',
 'js-assignment-value': 'const itemCount = 3;',
 'js-delimiters': 'if (ready) { console.log("Ready"); }',
 'js-member-separator': 'const label = document.querySelector(".label");\nlabel.textContent = "Ready";',
 'js-split-name': 'const heading = document.querySelector("h1");',
 'js-handler-call': 'button.addEventListener("click", openMenu);',
 'js-collection-member': 'for (const link of document.querySelectorAll("a")) {\n  link.classList.add("highlight");\n}',
});
