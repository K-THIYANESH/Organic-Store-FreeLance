// Product & Category Data Catalog for GoOrganic
// GoOrganic customer frontend demo.
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const categories=[
['Whole grains','Ancient grains & everyday staples','https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85'],
['Sugar & sweeteners','Honey and natural sweetening','https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=700&q=85'],
['Spices & masala','Aromatic essentials, full of character','https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=85'],
['Skincare','Gentle care inspired by nature','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85'],
['Seeds','Small beginnings, nourishing goodness','https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?auto=format&fit=crop&w=700&q=85'],
['Salt','Simple essentials for your kitchen','https://images.unsplash.com/photo-1518110925495-5fe2fda0442d?auto=format&fit=crop&w=700&q=85'],
['Refreshments','A refreshing pause in your day','https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=700&q=85'],
['Pulses','Protein-rich pantry favourites','https://images.unsplash.com/photo-1515543904379-3d757bbe4e7e?auto=format&fit=crop&w=700&q=85'],
['Pottery','Handcrafted pieces for mindful living','https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=85'],
['Papads','Traditional accompaniments','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85'],
['Palm products','A taste of traditional goodness','https://images.unsplash.com/photo-1604495772376-9657f0035eb5?auto=format&fit=crop&w=700&q=85'],
['Organic soaps','Everyday cleansing, thoughtfully made','https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=700&q=85'],
['Oils','Traditional oils for kitchen & care','https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85']
];

const products=[
{id:'honey',name:'Wildflower Honey',category:'Sugar & sweeteners',price:385,unit:'500 g',tag:'STORE FAVOURITE',img:categories[1][2],desc:'Pure raw wildflower honey harvested sustainably from unpolluted hills. Unprocessed and nutrient-dense, preserving all natural enzymes.'},
{id:'millet',name:'Traditional Millet Mix',category:'Whole grains',price:180,unit:'500 g',tag:'PANTRY ESSENTIAL',img:categories[0][2],desc:'Rich in calcium, fiber and minerals. Sourced directly from traditional dryland organic farmers practicing natural crop rotation.'},
{id:'masala',name:'Heritage Spice Blend',category:'Spices & masala',price:145,unit:'100 g',tag:'AROMATIC PICK',img:categories[2][2],desc:'Hand-pounded native aromatic spices sun-dried and blended without artificial flavor enhancers, preservatives or anti-caking chemicals.'},
{id:'sesame',name:'Cold-Pressed Sesame Oil',category:'Oils',price:320,unit:'500 ml',tag:'TRADITIONAL',img:categories[12][2],desc:'Extracted using traditional wooden chekku press method to retain natural antioxidants, aroma, and essential fatty acids.'},
{id:'pulses',name:'Native Green Gram',category:'Pulses',price:125,unit:'500 g',tag:'EVERYDAY GOOD',img:categories[7][2],desc:'Unpolished indigenous whole green gram grown with traditional organic farmyard manure. Easy to digest and rich in plant protein.'},
{id:'soap',name:'Herbal Bath Soap',category:'Organic soaps',price:95,unit:'100 g',tag:'GENTLE CARE',img:categories[11][2],desc:'Crafted with cold-pressed coconut oil, wild turmeric, neem extract and vetiver for gentle skin nourishment.'},
{id:'papad',name:'Traditional Rice Papad',category:'Papads',price:110,unit:'200 g',tag:'FAMILY FAVOURITE',img:categories[9][2],desc:'Sun-dried handcrafted papads prepared with heirloom rice flour, cold-pressed sesame oil, cumin seeds and rock salt.'},
{id:'pottery',name:'Handcrafted Clay Cup',category:'Pottery',price:240,unit:'1 piece',tag:'MADE BY HAND',img:categories[8][2],desc:'Pure terracotta earthen cups made on pottery wheels by village artisans in Tamil Nadu. Lead-free, unglazed, and 100% natural.'}
];
