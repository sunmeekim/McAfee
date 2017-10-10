$(function () {
    $('#gnb .btnNav').on('click', function () {
        $('#header').toggleClass('navOn');
    });

    $('#gnb a').on('click', function () {
        $(this).closest('ul').find('li').removeClass('on');
        $(this).parent().toggleClass('on');
    });
    
});

