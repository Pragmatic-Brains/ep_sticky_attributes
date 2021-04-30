'use strict';

const attributes = {
    66: 'bold',
    73: 'italic',
    85: 'underline',
    53: 'strikethrough',
};

const styleNames = [
    'bold',
    'italic',
    'underline',
    'strikethrough',
]

exports.postAceInit = (hook, context) => {
    // On click of a bold etc. button
    $('.buttonicon-bold, .buttonicon-italic, .buttonicon-underline, .buttonicon-strikethrough')
        .parent().parent().bind('click', (button) => {
        const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
        return padeditor.ace.callWithAce((ace) => {
            const rep = ace.ace_getRep();
            const chars = rep.selStart[1];
            const isSpecial = ace.ace_getAttributeOnSelection('hidden', true)
            rep.selStart[1] =  chars;
            // if we're not selecting any text or we selecting some hidden text :)
            if (rep.selStart[0] === rep.selEnd[0] && (rep.selEnd[1] === rep.selStart[1] || (isSpecial && rep.selEnd[1] === rep.selStart[1] + 1))) {
                // get the clicked attribute IE bold, italic
                const buttonEle = $(button)[0].currentTarget;
                const attribute = $(buttonEle).data('key');
                // seems messy but basically this is required to know if we're
                // following a previous attribute
                const isApplied = new Map()
                styleNames.map(stylek => {
                    const chars = rep.selStart[1];
                    const active = ace.ace_getAttributeOnSelection(stylek, true)
                    rep.selStart[1] =  chars;
                    isApplied.set(stylek, active) })

                // Append a hidden character the current caret position
                if(!isSpecial) {
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, '');
                }
                ace.ace_replaceRange(rep.selStart, rep.selEnd, ' ');
                rep.selStart[1] -= 1; // overwrite the secret hidden character
                rep.selEnd[1] = rep.selStart[1] + 1;
                isApplied.forEach((active, style) => {
                    if (attribute === style && !isSpecial) {
                            if (!active) {
                                ace.ace_setAttributeOnSelection(style, true);
                                $(`.buttonicon-${style}`).parent().addClass('activeButton');
                            } else {
                                ace.ace_setAttributeOnSelection(style, false);
                                $(`.buttonicon-${style}`).parent().removeClass('activeButton');
                            }

                    } else {

                            if (active) {
                                ace.ace_setAttributeOnSelection(style, true);
                                $(`.buttonicon-${style}`).parent().addClass('activeButton');
                            } else {
                                ace.ace_setAttributeOnSelection(style, false);
                                $(`.buttonicon-${style}`).parent().removeClass('activeButton');
                            }

                    }
                })
                ace.ace_toggleAttributeOnSelection('hidden');
            }
        }, 'stickyAttribute');
    });
};

// Change the attribute into a class
exports.aceAttribsToClasses = (hook, context) => {
    if (context.key.indexOf('hidden') !== -1) {
        return ['hidden'];
    }
};

exports.aceKeyEvent = (hook, callstack, cb) => {
    const evt = callstack.evt;
    const k = evt.keyCode;
    const isAttributeKey = (
        evt.ctrlKey && (
        k === 66 || k === 73 || k === 85 || k === 53) && evt.type === 'keyup');

    clientVars.sticky = {};

    if (isAttributeKey) {
        const attribute = attributes[k]; // which attribute is it?
        clientVars.sticky.setAttribute = true;
        clientVars.sticky.attribute = attribute;
    } else {
        clientVars.sticky.setAttribute = false;
        return cb(false);
    }
};

const checkAttr = (context, documentAttributeManager) => {
    const rep = context.rep;
    // seems messy but basically this is required to know if
    // we're following a previous attribute
    
        $.each(attributes, (k, attribute) => {
            const chars = rep.selStart[1];
            const isApplied = documentAttributeManager.getAttributeOnSelection(attribute, true);
            rep.selStart[1] = chars;
            if (isApplied) {
                $(`.buttonicon-${attribute}`).parent().addClass('activeButton');
            } else {
                $(`.buttonicon-${attribute}`).parent().removeClass('activeButton');
            }
        });
    
};


exports.aceEditEvent = (hook, context, cb) => {
    const call = context.callstack;
    const documentAttributeManager = context.documentAttributeManager;
    const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

    if (call.type !== 'idleWorkTimer') return cb();
    const rep = context.documentAttributeManager.rep;
    if (!rep.selStart && !rep.selEnd) return cb();

    // Are we supposed to be applying or removing an attribute?
    let isToProcess = true;
    if (!clientVars.sticky || !clientVars.sticky.setAttribute) {
        isToProcess = false;
    }
    // Create a hidden element and set the attribute on it
    if (isToProcess) {
        padeditor.ace.callWithAce((ace) => {
            const chars = rep.selStart[1];
            const isSpecial = ace.ace_getAttributeOnSelection('hidden', true)
            rep.selStart[1] =  chars;
            // if we're not selecting any text or we selecting some hidden text :)
            if (rep.selStart[0] === rep.selEnd[0] && (rep.selEnd[1] === rep.selStart[1] || (isSpecial && rep.selEnd[1] === rep.selStart[1] + 1))) {
                // seems messy but basically this is required to know if we're
                // following a previous attribute
                const isApplied = new Map()
                styleNames.map(stylek => {
                    const chars = rep.selStart[1];
                    const active = ace.ace_getAttributeOnSelection(stylek, true)
                    rep.selStart[1] =  chars;
                    isApplied.set(stylek, active) })
                // Append a hidden character the current caret position
                if(!isSpecial) {
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, '');
                }
                ace.ace_replaceRange(rep.selStart, rep.selEnd, ' ');
                rep.selStart[1] -= 1; // overwrite the secret hidden character
                rep.selEnd[1] = rep.selStart[1] + 1;
                isApplied.forEach((active, style) => {
                    if (clientVars.sticky.attribute === style && !isSpecial) {
                        if (!active) {
                            ace.ace_setAttributeOnSelection(style, true);
                            $(`.buttonicon-${style}`).parent().addClass('activeButton');
                        } else {
                            ace.ace_setAttributeOnSelection(style, false);
                            $(`.buttonicon-${style}`).parent().removeClass('activeButton');
                        }
                    } else {
                        if (active) {
                            ace.ace_setAttributeOnSelection(style, true);
                            $(`.buttonicon-${style}`).parent().addClass('activeButton');
                        } else {
                            ace.ace_setAttributeOnSelection(style, false);
                            $(`.buttonicon-${style}`).parent().removeClass('activeButton');
                        }
                    }
                })
                ace.ace_toggleAttributeOnSelection('hidden');
            }
        }, 'stickyAttribute');
    }

    if (clientVars.sticky) {
        clientVars.sticky.setAttribute = false;
    }

    setTimeout(() => {
        checkAttr(context, documentAttributeManager);
    }, 100);
    return cb();
};

exports.aceEditorCSS = (hookName, cb) => ['/ep_sticky_attributes/static/css/ace.css'];
