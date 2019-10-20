import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, FlatList, StyleSheet, Clipboard } from 'react-native';
import Fontisto from 'react-native-vector-icons/Fontisto';

import {
  CheckBox,
  CheckBoxButton,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  TextButton,
  Text,
  HGroup,
  SmallHeader,
  Section,
  ModalScreen,
} from '@actualwave/react-native-kingnare-style';

const ENTITIES = [
  {
    entity: 'quot',
    code: 34,
    symbol: '\u0022',
  },
  {
    entity: 'amp',
    code: 38,
    symbol: '\u0026',
  },
  {
    entity: 'apos',
    code: 39,
    symbol: '\u0027',
  },
  {
    entity: 'lt',
    code: 60,
    symbol: '\u003c',
  },
  {
    entity: 'gt',
    code: 62,
    symbol: '\u003e',
  },
  {
    entity: 'nbsp',
    code: 160,
    symbol: '\u00a0',
  },
  {
    entity: 'iexcl',
    code: 161,
    symbol: '\u00a1',
  },
  {
    entity: 'cent',
    code: 162,
    symbol: '\u00a2',
  },
  {
    entity: 'pound',
    code: 163,
    symbol: '\u00a3',
  },
  {
    entity: 'curren',
    code: 164,
    symbol: '\u00a4',
  },
  {
    entity: 'yen',
    code: 165,
    symbol: '\u00a5',
  },
  {
    entity: 'brvbar',
    code: 166,
    symbol: '\u00a6',
  },
  {
    entity: 'sect',
    code: 167,
    symbol: '\u00a7',
  },
  {
    entity: 'uml',
    code: 168,
    symbol: '\u00a8',
  },
  {
    entity: 'copy',
    code: 169,
    symbol: '\u00a9',
  },
  {
    entity: 'ordf',
    code: 170,
    symbol: '\u00aa',
  },
  {
    entity: 'laquo',
    code: 171,
    symbol: '\u00ab',
  },
  {
    entity: 'not',
    code: 172,
    symbol: '\u00ac',
  },
  {
    entity: 'shy',
    code: 173,
    symbol: '\u00ad',
  },
  {
    entity: 'reg',
    code: 174,
    symbol: '\u00ae',
  },
  {
    entity: 'macr',
    code: 175,
    symbol: '\u00af',
  },
  {
    entity: 'deg',
    code: 176,
    symbol: '\u00b0',
  },
  {
    entity: 'plusmn',
    code: 177,
    symbol: '\u00b1',
  },
  {
    entity: 'sup2',
    code: 178,
    symbol: '\u00b2',
  },
  {
    entity: 'sup3',
    code: 179,
    symbol: '\u00b3',
  },
  {
    entity: 'acute',
    code: 180,
    symbol: '\u00b4',
  },
  {
    entity: 'micro',
    code: 181,
    symbol: '\u00b5',
  },
  {
    entity: 'para',
    code: 182,
    symbol: '\u00b6',
  },
  {
    entity: 'middot',
    code: 183,
    symbol: '\u00b7',
  },
  {
    entity: 'cedil',
    code: 184,
    symbol: '\u00b8',
  },
  {
    entity: 'sup1',
    code: 185,
    symbol: '\u00b9',
  },
  {
    entity: 'ordm',
    code: 186,
    symbol: '\u00ba',
  },
  {
    entity: 'raquo',
    code: 187,
    symbol: '\u00bb',
  },
  {
    entity: 'frac14',
    code: 188,
    symbol: '\u00bc',
  },
  {
    entity: 'frac12',
    code: 189,
    symbol: '\u00bd',
  },
  {
    entity: 'frac34',
    code: 190,
    symbol: '\u00be',
  },
  {
    entity: 'iquest',
    code: 191,
    symbol: '\u00bf',
  },
  {
    entity: 'Agrave',
    code: 192,
    symbol: '\u00c0',
  },
  {
    entity: 'Aacute',
    code: 193,
    symbol: '\u00c1',
  },
  {
    entity: 'Acirc',
    code: 194,
    symbol: '\u00c2',
  },
  {
    entity: 'Atilde',
    code: 195,
    symbol: '\u00c3',
  },
  {
    entity: 'Auml',
    code: 196,
    symbol: '\u00c4',
  },
  {
    entity: 'Aring',
    code: 197,
    symbol: '\u00c5',
  },
  {
    entity: 'AElig',
    code: 198,
    symbol: '\u00c6',
  },
  {
    entity: 'Ccedil',
    code: 199,
    symbol: '\u00c7',
  },
  {
    entity: 'Egrave',
    code: 200,
    symbol: '\u00c8',
  },
  {
    entity: 'Eacute',
    code: 201,
    symbol: '\u00c9',
  },
  {
    entity: 'Ecirc',
    code: 202,
    symbol: '\u00ca',
  },
  {
    entity: 'Euml',
    code: 203,
    symbol: '\u00cb',
  },
  {
    entity: 'Igrave',
    code: 204,
    symbol: '\u00cc',
  },
  {
    entity: 'Iacute',
    code: 205,
    symbol: '\u00cd',
  },
  {
    entity: 'Icirc',
    code: 206,
    symbol: '\u00ce',
  },
  {
    entity: 'Iuml',
    code: 207,
    symbol: '\u00cf',
  },
  {
    entity: 'ETH',
    code: 208,
    symbol: '\u00d0',
  },
  {
    entity: 'Ntilde',
    code: 209,
    symbol: '\u00d1',
  },
  {
    entity: 'Ograve',
    code: 210,
    symbol: '\u00d2',
  },
  {
    entity: 'Oacute',
    code: 211,
    symbol: '\u00d3',
  },
  {
    entity: 'Ocirc',
    code: 212,
    symbol: '\u00d4',
  },
  {
    entity: 'Otilde',
    code: 213,
    symbol: '\u00d5',
  },
  {
    entity: 'Ouml',
    code: 214,
    symbol: '\u00d6',
  },
  {
    entity: 'times',
    code: 215,
    symbol: '\u00d7',
  },
  {
    entity: 'Oslash',
    code: 216,
    symbol: '\u00d8',
  },
  {
    entity: 'Ugrave',
    code: 217,
    symbol: '\u00d9',
  },
  {
    entity: 'Uacute',
    code: 218,
    symbol: '\u00da',
  },
  {
    entity: 'Ucirc',
    code: 219,
    symbol: '\u00db',
  },
  {
    entity: 'Uuml',
    code: 220,
    symbol: '\u00dc',
  },
  {
    entity: 'Yacute',
    code: 221,
    symbol: '\u00dd',
  },
  {
    entity: 'THORN',
    code: 222,
    symbol: '\u00de',
  },
  {
    entity: 'szlig',
    code: 223,
    symbol: '\u00df',
  },
  {
    entity: 'agrave',
    code: 224,
    symbol: '\u00e0',
  },
  {
    entity: 'aacute',
    code: 225,
    symbol: '\u00e1',
  },
  {
    entity: 'acirc',
    code: 226,
    symbol: '\u00e2',
  },
  {
    entity: 'atilde',
    code: 227,
    symbol: '\u00e3',
  },
  {
    entity: 'auml',
    code: 228,
    symbol: '\u00e4',
  },
  {
    entity: 'aring',
    code: 229,
    symbol: '\u00e5',
  },
  {
    entity: 'aelig',
    code: 230,
    symbol: '\u00e6',
  },
  {
    entity: 'ccedil',
    code: 231,
    symbol: '\u00e7',
  },
  {
    entity: 'egrave',
    code: 232,
    symbol: '\u00e8',
  },
  {
    entity: 'eacute',
    code: 233,
    symbol: '\u00e9',
  },
  {
    entity: 'ecirc',
    code: 234,
    symbol: '\u00ea',
  },
  {
    entity: 'euml',
    code: 235,
    symbol: '\u00eb',
  },
  {
    entity: 'igrave',
    code: 236,
    symbol: '\u00ec',
  },
  {
    entity: 'iacute',
    code: 237,
    symbol: '\u00ed',
  },
  {
    entity: 'icirc',
    code: 238,
    symbol: '\u00ee',
  },
  {
    entity: 'iuml',
    code: 239,
    symbol: '\u00ef',
  },
  {
    entity: 'eth',
    code: 240,
    symbol: '\u00f0',
  },
  {
    entity: 'ntilde',
    code: 241,
    symbol: '\u00f1',
  },
  {
    entity: 'ograve',
    code: 242,
    symbol: '\u00f2',
  },
  {
    entity: 'oacute',
    code: 243,
    symbol: '\u00f3',
  },
  {
    entity: 'ocirc',
    code: 244,
    symbol: '\u00f4',
  },
  {
    entity: 'otilde',
    code: 245,
    symbol: '\u00f5',
  },
  {
    entity: 'ouml',
    code: 246,
    symbol: '\u00f6',
  },
  {
    entity: 'divide',
    code: 247,
    symbol: '\u00f7',
  },
  {
    entity: 'oslash',
    code: 248,
    symbol: '\u00f8',
  },
  {
    entity: 'ugrave',
    code: 249,
    symbol: '\u00f9',
  },
  {
    entity: 'uacute',
    code: 250,
    symbol: '\u00fa',
  },
  {
    entity: 'ucirc',
    code: 251,
    symbol: '\u00fb',
  },
  {
    entity: 'uuml',
    code: 252,
    symbol: '\u00fc',
  },
  {
    entity: 'yacute',
    code: 253,
    symbol: '\u00fd',
  },
  {
    entity: 'thorn',
    code: 254,
    symbol: '\u00fe',
  },
  {
    entity: 'yuml',
    code: 255,
    symbol: '\u00ff',
  },
  {
    entity: 'OElig',
    code: 338,
    symbol: '\u0152',
  },
  {
    entity: 'oelig',
    code: 339,
    symbol: '\u0153',
  },
  {
    entity: 'Scaron',
    code: 352,
    symbol: '\u0160',
  },
  {
    entity: 'scaron',
    code: 353,
    symbol: '\u0161',
  },
  {
    entity: 'Yuml',
    code: 376,
    symbol: '\u0178',
  },
  {
    entity: 'fnof',
    code: 402,
    symbol: '\u0192',
  },
  {
    entity: 'circ',
    code: 710,
    symbol: '\u02c6',
  },
  {
    entity: 'tilde',
    code: 732,
    symbol: '\u02dc',
  },
  {
    entity: 'Alpha',
    code: 913,
    symbol: '\u0391',
  },
  {
    entity: 'Beta',
    code: 914,
    symbol: '\u0392',
  },
  {
    entity: 'Gamma',
    code: 915,
    symbol: '\u0393',
  },
  {
    entity: 'Delta',
    code: 916,
    symbol: '\u0394',
  },
  {
    entity: 'Epsilon',
    code: 917,
    symbol: '\u0395',
  },
  {
    entity: 'Zeta',
    code: 918,
    symbol: '\u0396',
  },
  {
    entity: 'Eta',
    code: 919,
    symbol: '\u0397',
  },
  {
    entity: 'Theta',
    code: 920,
    symbol: '\u0398',
  },
  {
    entity: 'Iota',
    code: 921,
    symbol: '\u0399',
  },
  {
    entity: 'Kappa',
    code: 922,
    symbol: '\u039a',
  },
  {
    entity: 'Lambda',
    code: 923,
    symbol: '\u039b',
  },
  {
    entity: 'Mu',
    code: 924,
    symbol: '\u039c',
  },
  {
    entity: 'Nu',
    code: 925,
    symbol: '\u039d',
  },
  {
    entity: 'Xi',
    code: 926,
    symbol: '\u039e',
  },
  {
    entity: 'Omicron',
    code: 927,
    symbol: '\u039f',
  },
  {
    entity: 'Pi',
    code: 928,
    symbol: '\u03a0',
  },
  {
    entity: 'Rho',
    code: 929,
    symbol: '\u03a1',
  },
  {
    entity: 'Sigma',
    code: 931,
    symbol: '\u03a3',
  },
  {
    entity: 'Tau',
    code: 932,
    symbol: '\u03a4',
  },
  {
    entity: 'Upsilon',
    code: 933,
    symbol: '\u03a5',
  },
  {
    entity: 'Phi',
    code: 934,
    symbol: '\u03a6',
  },
  {
    entity: 'Chi',
    code: 935,
    symbol: '\u03a7',
  },
  {
    entity: 'Psi',
    code: 936,
    symbol: '\u03a8',
  },
  {
    entity: 'Omega',
    code: 937,
    symbol: '\u03a9',
  },
  {
    entity: 'alpha',
    code: 945,
    symbol: '\u03b1',
  },
  {
    entity: 'beta',
    code: 946,
    symbol: '\u03b2',
  },
  {
    entity: 'gamma',
    code: 947,
    symbol: '\u03b3',
  },
  {
    entity: 'delta',
    code: 948,
    symbol: '\u03b4',
  },
  {
    entity: 'epsilon',
    code: 949,
    symbol: '\u03b5',
  },
  {
    entity: 'zeta',
    code: 950,
    symbol: '\u03b6',
  },
  {
    entity: 'eta',
    code: 951,
    symbol: '\u03b7',
  },
  {
    entity: 'theta',
    code: 952,
    symbol: '\u03b8',
  },
  {
    entity: 'iota',
    code: 953,
    symbol: '\u03b9',
  },
  {
    entity: 'kappa',
    code: 954,
    symbol: '\u03ba',
  },
  {
    entity: 'lambda',
    code: 955,
    symbol: '\u03bb',
  },
  {
    entity: 'mu',
    code: 956,
    symbol: '\u03bc',
  },
  {
    entity: 'nu',
    code: 957,
    symbol: '\u03bd',
  },
  {
    entity: 'xi',
    code: 958,
    symbol: '\u03be',
  },
  {
    entity: 'omicron',
    code: 959,
    symbol: '\u03bf',
  },
  {
    entity: 'pi',
    code: 960,
    symbol: '\u03c0',
  },
  {
    entity: 'rho',
    code: 961,
    symbol: '\u03c1',
  },
  {
    entity: 'sigmaf',
    code: 962,
    symbol: '\u03c2',
  },
  {
    entity: 'sigma',
    code: 963,
    symbol: '\u03c3',
  },
  {
    entity: 'tau',
    code: 964,
    symbol: '\u03c4',
  },
  {
    entity: 'upsilon',
    code: 965,
    symbol: '\u03c5',
  },
  {
    entity: 'phi',
    code: 966,
    symbol: '\u03c6',
  },
  {
    entity: 'chi',
    code: 967,
    symbol: '\u03c7',
  },
  {
    entity: 'psi',
    code: 968,
    symbol: '\u03c8',
  },
  {
    entity: 'omega',
    code: 969,
    symbol: '\u03c9',
  },
  {
    entity: 'thetasym',
    code: 977,
    symbol: '\u03d1',
  },
  {
    entity: 'upsih',
    code: 978,
    symbol: '\u03d2',
  },
  {
    entity: 'piv',
    code: 982,
    symbol: '\u03d6',
  },
  {
    entity: 'ensp',
    code: 8194,
    symbol: '\u2002',
  },
  {
    entity: 'emsp',
    code: 8195,
    symbol: '\u2003',
  },
  {
    entity: 'thinsp',
    code: 8201,
    symbol: '\u2009',
  },
  {
    entity: 'zwnj',
    code: 8204,
    symbol: '\u200c',
  },
  {
    entity: 'zwj',
    code: 8205,
    symbol: '\u200d',
  },
  {
    entity: 'lrm',
    code: 8206,
    symbol: '\u200e',
  },
  {
    entity: 'rlm',
    code: 8207,
    symbol: '\u200f',
  },
  {
    entity: 'ndash',
    code: 8211,
    symbol: '\u2013',
  },
  {
    entity: 'mdash',
    code: 8212,
    symbol: '\u2014',
  },
  {
    entity: 'lsquo',
    code: 8216,
    symbol: '\u2018',
  },
  {
    entity: 'rsquo',
    code: 8217,
    symbol: '\u2019',
  },
  {
    entity: 'sbquo',
    code: 8218,
    symbol: '\u201a',
  },
  {
    entity: 'ldquo',
    code: 8220,
    symbol: '\u201c',
  },
  {
    entity: 'rdquo',
    code: 8221,
    symbol: '\u201d',
  },
  {
    entity: 'bdquo',
    code: 8222,
    symbol: '\u201e',
  },
  {
    entity: 'dagger',
    code: 8224,
    symbol: '\u2020',
  },
  {
    entity: 'Dagger',
    code: 8225,
    symbol: '\u2021',
  },
  {
    entity: 'bull',
    code: 8226,
    symbol: '\u2022',
  },
  {
    entity: 'hellip',
    code: 8230,
    symbol: '\u2026',
  },
  {
    entity: 'permil',
    code: 8240,
    symbol: '\u2030',
  },
  {
    entity: 'prime',
    code: 8242,
    symbol: '\u2032',
  },
  {
    entity: 'Prime',
    code: 8243,
    symbol: '\u2033',
  },
  {
    entity: 'lsaquo',
    code: 8249,
    symbol: '\u2039',
  },
  {
    entity: 'rsaquo',
    code: 8250,
    symbol: '\u203a',
  },
  {
    entity: 'oline',
    code: 8254,
    symbol: '\u203e',
  },
  {
    entity: 'frasl',
    code: 8260,
    symbol: '\u2044',
  },
  {
    entity: 'euro',
    code: 8364,
    symbol: '\u20ac',
  },
  {
    entity: 'image',
    code: 8465,
    symbol: '\u2111',
  },
  {
    entity: 'weierp',
    code: 8472,
    symbol: '\u2118',
  },
  {
    entity: 'real',
    code: 8476,
    symbol: '\u211c',
  },
  {
    entity: 'trade',
    code: 8482,
    symbol: '\u2122',
  },
  {
    entity: 'alefsym',
    code: 8501,
    symbol: '\u2135',
  },
  {
    entity: 'larr',
    code: 8592,
    symbol: '\u2190',
  },
  {
    entity: 'uarr',
    code: 8593,
    symbol: '\u2191',
  },
  {
    entity: 'rarr',
    code: 8594,
    symbol: '\u2192',
  },
  {
    entity: 'darr',
    code: 8595,
    symbol: '\u2193',
  },
  {
    entity: 'harr',
    code: 8596,
    symbol: '\u2194',
  },
  {
    entity: 'crarr',
    code: 8629,
    symbol: '\u21b5',
  },
  {
    entity: 'lArr',
    code: 8656,
    symbol: '\u21d0',
  },
  {
    entity: 'uArr',
    code: 8657,
    symbol: '\u21d1',
  },
  {
    entity: 'rArr',
    code: 8658,
    symbol: '\u21d2',
  },
  {
    entity: 'dArr',
    code: 8659,
    symbol: '\u21d3',
  },
  {
    entity: 'hArr',
    code: 8660,
    symbol: '\u21d4',
  },
  {
    entity: 'forall',
    code: 8704,
    symbol: '\u2200',
  },
  {
    entity: 'part',
    code: 8706,
    symbol: '\u2202',
  },
  {
    entity: 'exist',
    code: 8707,
    symbol: '\u2203',
  },
  {
    entity: 'empty',
    code: 8709,
    symbol: '\u2205',
  },
  {
    entity: 'nabla',
    code: 8711,
    symbol: '\u2207',
  },
  {
    entity: 'isin',
    code: 8712,
    symbol: '\u2208',
  },
  {
    entity: 'notin',
    code: 8713,
    symbol: '\u2209',
  },
  {
    entity: 'ni',
    code: 8715,
    symbol: '\u220b',
  },
  {
    entity: 'prod',
    code: 8719,
    symbol: '\u220f',
  },
  {
    entity: 'sum',
    code: 8721,
    symbol: '\u2211',
  },
  {
    entity: 'minus',
    code: 8722,
    symbol: '\u2212',
  },
  {
    entity: 'lowast',
    code: 8727,
    symbol: '\u2217',
  },
  {
    entity: 'radic',
    code: 8730,
    symbol: '\u221a',
  },
  {
    entity: 'prop',
    code: 8733,
    symbol: '\u221d',
  },
  {
    entity: 'infin',
    code: 8734,
    symbol: '\u221e',
  },
  {
    entity: 'ang',
    code: 8736,
    symbol: '\u2220',
  },
  {
    entity: 'and',
    code: 8743,
    symbol: '\u2227',
  },
  {
    entity: 'or',
    code: 8744,
    symbol: '\u2228',
  },
  {
    entity: 'cap',
    code: 8745,
    symbol: '\u2229',
  },
  {
    entity: 'cup',
    code: 8746,
    symbol: '\u222a',
  },
  {
    entity: 'int',
    code: 8747,
    symbol: '\u222b',
  },
  {
    entity: 'there4',
    code: 8756,
    symbol: '\u2234',
  },
  {
    entity: 'sim',
    code: 8764,
    symbol: '\u223c',
  },
  {
    entity: 'cong',
    code: 8773,
    symbol: '\u2245',
  },
  {
    entity: 'asymp',
    code: 8776,
    symbol: '\u2248',
  },
  {
    entity: 'ne',
    code: 8800,
    symbol: '\u2260',
  },
  {
    entity: 'equiv',
    code: 8801,
    symbol: '\u2261',
  },
  {
    entity: 'le',
    code: 8804,
    symbol: '\u2264',
  },
  {
    entity: 'ge',
    code: 8805,
    symbol: '\u2265',
  },
  {
    entity: 'sub',
    code: 8834,
    symbol: '\u2282',
  },
  {
    entity: 'sup',
    code: 8835,
    symbol: '\u2283',
  },
  {
    entity: 'nsub',
    code: 8836,
    symbol: '\u2284',
  },
  {
    entity: 'sube',
    code: 8838,
    symbol: '\u2286',
  },
  {
    entity: 'supe',
    code: 8839,
    symbol: '\u2287',
  },
  {
    entity: 'oplus',
    code: 8853,
    symbol: '\u2295',
  },
  {
    entity: 'otimes',
    code: 8855,
    symbol: '\u2297',
  },
  {
    entity: 'perp',
    code: 8869,
    symbol: '\u22a5',
  },
  {
    entity: 'sdot',
    code: 8901,
    symbol: '\u22c5',
  },
  {
    entity: 'lceil',
    code: 8968,
    symbol: '\u2308',
  },
  {
    entity: 'rceil',
    code: 8969,
    symbol: '\u2309',
  },
  {
    entity: 'lfloor',
    code: 8970,
    symbol: '\u230a',
  },
  {
    entity: 'rfloor',
    code: 8971,
    symbol: '\u230b',
  },
  {
    entity: 'lang',
    code: 9001,
    symbol: '\u2329',
  },
  {
    entity: 'rang',
    code: 9002,
    symbol: '\u232a',
  },
  {
    entity: 'loz',
    code: 9674,
    symbol: '\u25ca',
  },
  {
    entity: 'spades',
    code: 9824,
    symbol: '\u2660',
  },
  {
    entity: 'clubs',
    code: 9827,
    symbol: '\u2663',
  },
  {
    entity: 'hearts',
    code: 9829,
    symbol: '\u2665',
  },
  {
    entity: 'diams',
    code: 9830,
    symbol: '\u2666',
  },
];

const getUnicodeEscapeString = (code) => `\\u${code.toString(16).padStart(4, '0')}`;

const HtmlEntitiesToolView = ({ list, close, pasteIntoCode, copyToClipboard }) => {
  const [selectedImports, setSelectedImports] = useState({});

  return (
    <>
      <SmallHeader>Unicode Symbols</SmallHeader>
      <ImportsList
        list={list}
        selectedImports={selectedImports}
        setSelectedImports={setSelectedImports}
      />
      <HGroup style={{ marginTop: 5 }}>
        <TextButton label="Cancel" onPress={close} />
        <View style={styles.fullFlex} />
        <TextButton
          label="Copy"
          onPress={() => {
            const importsStr = buildImports(selectedImports);
            copyToClipboard(importsStr);
            close();
          }}
          style={{ marginHorizontal: 10 }}
        />
        <TextButton
          label="Paste To Code"
          onPress={() => {
            const importsStr = buildImports(selectedImports);
            pasteIntoCode(importsStr);
            close();
          }}
        />
      </HGroup>
    </>
  );
};

const HtmlEntitiesToolModal = withHostedModal(
  HtmlEntitiesToolView,
  ['pasteIntoCode', 'copyToClipboard'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: htmlEntitiesToolScreenRenderer } = HtmlEntitiesToolModal;

const tool = {
  type: 'editor',
  iconRenderer: () => <Fontisto name="money-symbol" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();

    showModal({
      renderer: htmlEntitiesToolScreenRenderer,
      props: {
        pasteIntoCode: async (value) => {
          editorApi.replaceSelection(value);
        },
        copyToClipboard: (value) => {
          Clipboard.setString(value);
        },
      },
    });
  },
};

export default tool;
