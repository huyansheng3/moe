// 视频对象
var player;

$(function() {
    var layer = null;
    var element = null;
    // 进度条需要使用
    layui.use('element', function() {
        element = layui.element;
    });
    layui.use('layer', function() {
        layer = layui.layer;
    });

    var jump_pid = $("#projectid").val();
    if (jump_pid && jump_pid != '0') {
        localStorage.setItem('jump_pid', jump_pid);
    }

    // 断点续播
    // 按优先级选择断点续播的方式
    var ls_video_last_play_time = localStorage.getItem(continuation_key);
    var video_last_play_time = 0;
    if (video_last_play_time_new) {
        console.log('已使用新版本断点续播');
        video_last_play_time = video_last_play_time_new;
    } else if (ls_video_last_play_time) {
        video_last_play_time = ls_video_last_play_time;
    } else {
        video_last_play_time = video_last_play_time_old;
    }

    // 后台获取视频时长，对比缓存记录时长
    video_last_play_time = parseInt(video_last_play_time);
    video_time_length = parseInt(video_time_length);
    video_last_play_time = (video_last_play_time >= video_time_length) ? 0 : video_last_play_time;

    // 华为视频播放 begin
    var option = {
        id: "vedioPlay",
        url: video_handle_path,
        width: "100%",
        height: 537,
        poster: '', // 封面
        closeInactive: false, // 使播放器控制栏常驻不隐藏
        lastPlayTime: video_last_play_time, //视频起播时间（单位：秒）
        lastPlayTimeHideDelay: 5, // 提示文字展示时长（单位：秒）
        video_host: video_host,
        countTime: {
            interval: 5,
            cb: function(object){
                // console.log(object.time);
                localStorage.setItem(continuation_key, object.time);
                playRecord(object.time);
            }
        }
    };

    // 视频初始化
    videoPlayer(option);

    // 视频播放完后回调函数
    player.on('ended', function() {
        console.log("on_player_ended");
        $(".episode").each(function(index, item) {
            if ($(this).hasClass('active')) {
                var $next = $(this).next();
                if ($next.length == 0) {
                    layer.open({
                        skin: 'search-dialog',
                        type: 1,
                        closeBtn: 1,
                        shadeClose: false,
                        scrollbar: false,
                        title: '提示',
                        offset: 'auto',
                        area: ['500px', '240px'],
                        resize: false,
                        content: "该课程已学完",
                        btn: ['返回课程列表'],
                        btnAlign: "c",
                        yes: function(index, layero) {
                            var exist_jump_pid = localStorage.getItem('jump_pid');
                            if (exist_jump_pid && exist_jump_pid != '0') {
                                window.location.href = '/syllabus/syllabus.php?projectid=' + exist_jump_pid;
                            } else {
                                window.location.href = '/program/program.php?act=showIndex';
                            }
                        }
                    });
                } else {
                    isContinuePlayer($next);
                }
            }
        });
        doFlushTime();
    });

    // 点击播放按钮回调
    player.on('play', function() {
        console.log("on_player_play");
        var flushtime = $("#flushlast").val() * 60 * 1000;
        var isSave = $('#isSave').val();
        var isOver = $('#isOver').val();
        var isSOver = $('#isSOver').val();
        if (isSave == 1 && isOver == 0 && isSOver == 0) {
            if (!global_plan) {
                console.log('开始计时', getNowTime(), global_plan);
                init(1);
                global_plan = setTimeout('doFlushTime()', flushtime);
            }
        }
    });

    // 点击暂停按钮回
    player.on('pause', function() {
        console.log("on_player_pause");
        if (global_plan) {
            console.log('关闭计时', getNowTime(), global_plan);
            clearInterval(global_plan);
            global_plan = null;
            doFlushTime();
            init(2);
        }
    });

    // 自动播放
    var is_save = $('#isSave').val();
    if (is_save == 1 || is_save == 2) {
        player.once('ready',()=>{
            console.log('ready');
            $('.xgplayer-icon-play').trigger('click');
        });
    }

    // player.onTimeUpdate = function(time) {
    //     console.log(time);
    // }

    // player.on('canplay', function() {
    //     console.log('canplay');
    // });
    // 华为视频播放 end

    // 自动判断是否开始学习
    setTimeout(function() {
        // this is normal and
        var is_auto = $('#isSave').val();
        if (is_auto != 1 && is_auto != 2) {
            $("#studyTipMsg").html('是否开始学习？');
            layer.open({
                skin: 'confirm-dialog',
                type: 1,
                closeBtn: 1,
                shadeClose: false,
                scrollbar: false,
                title: '重要提示',
                offset: 'auto',
                area: ['500px', '240px'],
                resize: false,
                content: $(".studyTip-box"),
                btnAlign: "c",
                btn: ['确定', '取消'],
                yes: function(index, layero) {
                    layer.close(index);
                    setTimeout(function(){
                        bindProject();
                    }, 500);
                },
                end: function() {
                }
            });
        }
    }, 500);
});

// init
function init(type) {
    // return 1;
    var url = "/program/program.php?act=doTemp";
    var data = "random=" + Math.random();
    $.ajax({
        type: "GET",
        url: url,
        data: {
            'programid': $("#programid").val(),
            'projectid': $("#projectid").val(),
            'volumeId': $("#volumeId").val(),
            'type': type
        },
        success: function(response) {
            console.log(response);
        }
    });
}

// save time
function saveTime() {
    doFlushTime(true);
}

// auto flush time
var times = 0;
function doFlushTime(flag = false) {
    times += 1;
    console.log('计时时间：', getNowTime(), '计时次数：', times);
    var programid = $('#programid').val();
    var url = "/program/program.php?act=doFlush";
    var data = "random=" + Math.random();
    $.ajax({
        type: "GET",
        url: url,
        data: data,
        timeout: 10000,
        dataType: "json",
        success: function(response) {
            if (flag) {
                layer.msg("已记录当前学时", { time: 2000 }, function() {
                    location.reload();
                });
                return;
            }
            console.log(response);
            // 未完结则继续计时
            if (response.precent) {
                layui.use('element', function() {
                    layui.element.progress('demo', response.precent + '%');
                });
            }
            if (response.isover == 0 && response.flushlast > 0) {
                if (global_plan) {
                    global_plan = setTimeout('doFlushTime()', response.flushlast * 1000);
                } else {
                    console.log('暂停模式临时计时');
                }
            } else if (response.isover == 1) {
                // 课程结束
            } else if (response.isover == 2) {
                // 单集课程结束
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {}
    });
}

// get now time
var getNowTime = function() {
    let dateTime;
    let yy = new Date().getFullYear();
    let mm = new Date().getMonth() + 1;
    let dd = new Date().getDate();
    let hh = new Date().getHours();
    let mf = new Date().getMinutes() < 10 ? '0' + new Date().getMinutes() : new Date().getMinutes();
    let ss = new Date().getSeconds() < 10 ? '0' + new Date().getSeconds() : new Date().getSeconds();
    dateTime = yy + '-' + mm + '-' + dd + ' ' + hh + ':' + mf + ':' + ss;
    // console.log(dateTime);
    return dateTime;
}

// vote
var isAllowTJ = true;

function vote() {
    var programid = $('#programid').val();
    var urlpath = "/program/program.php?act=doVote";
    var urlPar = "programid=" + programid + "&random=" + Math.random();
    if (isAllowTJ) {
        $.ajax({
            type: "GET",
            url: urlpath,
            data: urlPar,
            success: function(response) {
                if (response > "0") {
                    $("#vote_number").html(response);
                    isAllowTJ = false;
                } else if (response == 0) {
                    layer.alert("推荐操作失败!");
                }
            },
            error: function(data) {
                alert(data.responseText);
            }
        });
    } else {
        layer.open({
            skin: 'search-dialog',
            type: 1,
            closeBtn: 1,
            shadeClose: false,
            scrollbar: false,
            title: '提示',
            offset: 'auto',
            area: ['500px', '240px'],
            resize: false,
            content: "不允许重复推荐！",
            btnAlign: "c",
            btn: ['确定'],
            yes: function(index, layero) {
                layer.close(index);
            }
        });
    }
}

// bind project
function bindProject() {
    // project id
    var projectid = document.getElementById('projectid').value;
    // program id
    var programid = document.getElementById('programid').value;
    // this course unbind project & many projects
    var flag = document.getElementById("isShow").value;
    if (flag == 1) {
        joinProject(programid);
    } else {
        if (projectid == 0) {
            // 暂未报名项目弹窗  参数说明  content: $("#no-project")  btn: ['立即报名项目']
            layer.open({
                skin: 'confirm-dialog',
                type: 1,
                closeBtn: 1,
                shadeClose: false,
                scrollbar: false,
                title: '加入项目',
                offset: 'auto',
                area: ['900px', '702px'],
                resize: false,
                content: $("#no-project"),
                btn: ['立即报名项目'],
                btnAlign: "c",
                yes: function(index, layero) {
                    location.href = "/sign/sign.php";
                }
            });
        } else {
            joinProject(programid);

            // $("#studyTipMsg").html('<font>当前课件没有添加到选修课列表，您是否需要继续？<br><br>确定：加入选修课，并且学时计入选修学时<br>取消：不加入选修课并且继续播放，学时不计入选修课</font>');
            // layer.open({
            //     skin: 'confirm-dialog',
            //     type: 1,
            //     closeBtn: 1,
            //     shadeClose: false,
            //     scrollbar: false,
            //     title: '重要提示',
            //     offset: 'auto',
            //     area: ['500px', '300px'],
            //     resize: false,
            //     content: $(".studyTip-box"),
            //     btnAlign: "c",
            //     btn: ['确定', '取消'],
            //     yes: function(index, layero) {
            //         binding(programid, projectid);
            //     }
            // });
        }
    }
}

// join project
function joinProject(programid) {
    // 为每个项目添加点击事件，点击即选中
    // 这个事件仅 添加到项目 调用
    $("#join-project").find(".item-wrap").on("click", function(e) {
        $target = $(e.currentTarget);
        if (!$target.hasClass('active')) {
            $target.addClass('active');
            $target.siblings().removeClass("active");
        }
    });
    // 如果这个课程不在用户项目里，则弹窗提示用户将此课程添加入项目，参数说明  content: $("#join-project")  btn: ['添加到项目']
    layer.open({
        skin: 'confirm-dialog',
        type: 1,
        closeBtn: 1,
        shadeClose: false,
        scrollbar: false,
        title: '加入项目',
        offset: 'auto',
        area: ['900px', '702px'],
        resize: false,
        content: $("#join-project"),
        btn: ['添加到项目'],
        btnAlign: "c",
        yes: function(index, layero) {
            var projectid = $(".unbind-project.active").data("id");
            if (!projectid) {
                layer.msg('请选择想要加入的项目！');
                return;
            }
            binding(programid, projectid);
        }
    });
}

// bing action
function binding(programid, projectid) {
    layer.load(2);
    var url = "/program/program.php?act=addElectiveAjax&programid=" + programid + "&projectid=" + projectid + "&tmp=" + Math.random();
    $.getJSON(
        url, { async: false },
        function(response) {
            layer.closeAll('loading');
            if (!response.success) {
                layer.msg(response.message);
            } else {
                layer.msg("加入成功", { time: 2000 }, function() {
                    window.location.href = "/program/program.php?programid=" + programid + "&projectid=" + projectid;
                });
            }
        }
    );
}

// continue play
function isContinuePlayer($next) {
    layer.open({
        skin: 'confirm-dialog',
        type: 1,
        closeBtn: 1,
        shadeClose: false,
        scrollbar: false,
        title: '提示',
        offset: 'auto',
        area: ['500px', '240px'],
        resize: false,
        content: "<div class='center'>是否要继续播放课程？</div>",
        btn: ['确定', '取消'],
        btnAlign: "c",
        yes: function(index, layero) {
            // 点击确定
            $next.click();
            layer.close(index);
        },
        btn2: function() {}
    });
}

// play record
function playRecord(progress){
    $.ajax({
        type: "GET",
        url: API_URL + "/api/breakpoint/record",
        data: {
            course_id: $('#programid').val(),
            episode_id: episode_id,
            user_id: user_id,
            progress: progress
        },
        dataType: "jsonp",
        success: function(response) {
            if (response.success) {
                // console.log(response);
            } else {
                console.error(response);
            }
        }
    });
}

// 输出03:05:59 时分秒
function secondToDate(result) {
    var h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600);
    var m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
    var s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));
    return result = h + ":" + m + ":" + s;
}