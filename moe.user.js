// ==UserScript==
// @name         自动刷课
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  此脚本仅适用于 e-learning.moe.edu.cn 这个网址
// @author       huyansheng
// @match        https://e-learning.moe.edu.cn/*
// @icon         https://www.google.com/s2/favicons?domain=e-learning.moe.edu.cn
// @grant        none

// ==/UserScript==

(function () {
  const $tip = $("<div id='moe-tip'>自动刷课插件运行中～</div>").css({
    position: 'absolute',
    left: '20px',
    top: '20px',
    background: '#FFF',
    padding: '4px',
  });
  function tag() {
    $('body').append($tip);
  }

  function init() {
    tag();
    console.log('init');

    const videoList = Array.from(
      document.querySelectorAll(
        '.video-wrap .video-episode .course-number span',
      ),
    );
    const activeIndex = videoList.findIndex(
      (video) => video.className.indexOf('active') !== -1,
    );

    const nextIndex = activeIndex + 1;

    const video = document.querySelector('video');

    setInterval(() => {
      if (document.querySelector('video').paused) {
        console.log('自动播放');
        // 设置静音支持自动播放
        document.querySelector('video').muted = true;
        document
          .querySelector('video')
          .play()
          .then(() => {
            $tip.text('自动刷课插件运行中～~~，视频自动播放成功');
            console.log('自动播放成功');
          })
          .catch((error) => {
            console.log('自动播放失败', error);
          });
      }
    }, 2000);

    // 返回列表页面
    const jumpToList = () => {
      const backBtn = document.querySelector('.layui-layer-btn0');
      if (backBtn) {
        backBtn.click();
      }
    };

    setInterval(jumpToList, 60 * 1000);

    const next = () => {
      if (nextIndex < videoList.length) {
        videoList[nextIndex].click();
      } else {
        console.log('已结束');
        setTimeout(() => jumpToList(), 1000);
      }
    };

    // 视频结束切到下一个
    video.onended = () => {
      next();
    };

    // 或者检查进度结束切到下一个

    setInterval(() => {
      const text = document.querySelector('.layui-progress-text').textContent;
      if (parseInt(text) === 100) {
        next();
      }
    }, 60 * 1000);
  }

  function list() {
    tag();
    console.log('list');
    document.querySelector('.public-head-top #s1')?.click();
    setTimeout(() => {
      const list = Array.from(document.querySelectorAll('.study_status_1'));
      if (!list.length) {
        alert('全部课程已学习完毕');
      } else {
        list[0].querySelector('.table .btn-normal')?.click();
      }
    }, 1000);
  }

  $(document).ready(function () {
    if (
      location.pathname === '/syllabus/syllabus.php' &&
      location.search.indexOf('projectid') !== -1
    ) {
      list();
    } else if (location.pathname === '/program/program.php') {
      init();
    } else if (
      location.pathname === '/syllabus/syllabus.php' &&
      location.search.indexOf('showProjectList') !== -1
    ) {
      alert('请选择具体的项目学习');
    }
  });
})();
