const gotraSelect = document.getElementById('gotra');
const gotraOptions = [
    "Bansal", "Goyal", "Kuchhal", "Kansal", "Bindal", "Dharan", "Singhal", 
    "Jindal", "Mittal", "Tingal", "Tayal", "Garg", "Bhandal", "Nangal", 
    "Mangal", "Airan", "Madhukul", "Goyan"
];

gotraOptions.forEach(gotra => {
    const option = document.createElement('option');
    option.value = gotra;
    option.textContent = gotra;
    gotraSelect.appendChild(option);
});
