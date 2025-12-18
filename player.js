// 音乐数据 - 假设有5首本地音乐文件
const musicData = [
    {
        id: 1,
        title: "起风了",
        artist: "卖辣椒也用卷",
        duration: 325, // 5:25
        cover: "images/print1.jpg",
        url: "music/qifengl.m4a" // 本地音乐文件路径
    },
    {
        id: 2,
        title: "倒数",
        artist: "G.E.M.邓紫棋",
        album: "邓紫棋",
        duration: 229, // 3:49
        cover: "images/print2.jpg",
        url: "music/daoshu.ogg"
    },
    {
        id: 3,
        title: "富士山之下",
        artist: "陈奕迅",
        duration: 259, // 4:19
        cover: "images/print3.jpg",
        url: "music/fushi.ogg"
    },
    {
        id: 4,
        title: "K歌之王",
        artist: "陈奕迅",
        album: "重制版",
        duration: 222, // 3:42
        cover: "images/print4.jpg",
        url: "music/kge.ogg"
    },
    {
        id: 5,
        title: "小宇",
        artist: "张震岳",
        album: "汉字起飞",
        duration: 227, // 3：47
        cover: "images/print5.jpg",
        url: "music/xiaoyu.ogg"
    }
];

// 播放器状态
let playlist = [...musicData];
let currentTrackIndex = 0;
let isPlaying = false;
let volume = 0.7;
let repeatMode = 0; // 0: 不重复, 1: 单曲循环, 2: 列表循环
let playbackRate = 1.0; //默认1.0倍速

// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const playlistToggleBtn = document.getElementById('playlist-toggle-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeBar = document.getElementById('volume-bar');
    const volumeLevel = document.getElementById('volume-level');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const progressHandle = document.getElementById('progress-handle');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const playlistContent = document.getElementById('playlist-content');
    const playlistCount = document.getElementById('playlist-count');
    const albumCover = document.getElementById('album-cover');
    const musicTitle = document.getElementById('music-title');
    const musicArtist = document.getElementById('music-artist');
    const musicAlbum = document.getElementById('music-album');
    const albumDisc = document.getElementById('album-disc');
    
    // 时间跳转相关元素
    const timeJumpDialog = document.getElementById('time-jump-dialog');
    const jumpMinuteInput = document.getElementById('jump-minute');
    const jumpSecondInput = document.getElementById('jump-second');
    const jumpCancelBtn = document.getElementById('jump-cancel');
    const jumpConfirmBtn = document.getElementById('jump-confirm');
    
    // 倍速控制元素
    const speedToggle = document.getElementById('speed-toggle');
    const speedMenu = document.getElementById('speed-menu');
    const speedDisplay = document.getElementById('speed-display');
    
    // 初始化播放器
    initPlayer();
    
    // 初始化函数
    function initPlayer() {
        // 设置初始音量
        audioPlayer.volume = volume;
        updateVolumeDisplay();
        
        // 渲染播放列表
        renderPlaylist();
        
        // 加载第一首歌
        if (playlist.length > 0) {
            loadTrack(currentTrackIndex);
        }

        // 初始化倍速显示和选项
        updateSpeedDisplay();
        initSpeedOptions();
        
        // 绑定事件监听器
        bindEvents();
    }
    
    // 初始化倍速选项
    function initSpeedOptions() {
        const speedOptions = document.querySelectorAll('.speed-option');
        
        // 初始化时设置正确的active选项
        speedOptions.forEach(option => {
            const speed = parseFloat(option.dataset.speed);
            // 使用容差比较浮点数
            if (Math.abs(speed - playbackRate) < 0.01) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    // 绑定事件监听器
    function bindEvents() {
        // 播放/暂停按钮
        playPauseBtn.addEventListener('click', togglePlayPause);
        
        // 上一曲/下一曲按钮
        prevBtn.addEventListener('click', playPrevious);
        nextBtn.addEventListener('click', playNext);
        
        // 重复模式按钮
        repeatBtn.addEventListener('click', changeRepeatMode);
        
        // 音量控制
        volumeBtn.addEventListener('click', toggleMute);
        volumeBar.addEventListener('click', changeVolume);
        
        // 进度条控制
        progressBar.addEventListener('click', seek);
        let isDragging = false;
        
        progressHandle.addEventListener('mousedown', function(e) {
            isDragging = true;
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', function() {
                isDragging = false;
                document.removeEventListener('mousemove', handleDrag);
            });
        });
        
        // 双击进度条跳转时间对话框
        progressBar.addEventListener('dblclick', function() {
            showTimeJumpDialog();
        });
        
        // 时间跳转对话框
        jumpCancelBtn.addEventListener('click', hideTimeJumpDialog);
        jumpConfirmBtn.addEventListener('click', jumpToTime);
        
        // 音频事件监听
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', updateDuration);
        audioPlayer.addEventListener('ended', handleSongEnded);
        audioPlayer.addEventListener('play', () => updatePlayPauseButton(true));
        audioPlayer.addEventListener('pause', () => updatePlayPauseButton(false));
        
        // 专辑封面旋转动画
        audioPlayer.addEventListener('play', () => {
            albumCover.style.animation = 'rotate 20s linear infinite';
            albumDisc.style.opacity = '1';
        });
        
        audioPlayer.addEventListener('pause', () => {
            albumCover.style.animation = 'none';
            albumDisc.style.opacity = '0';
        });

        // 切换倍速菜单显示/隐藏
        speedToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            speedMenu.classList.toggle('active');
            speedToggle.classList.toggle('active');
        });
        
        // 选择倍速选项
        document.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', function() {
                const speed = parseFloat(this.dataset.speed);
                playbackRate = speed;
                audioPlayer.playbackRate = playbackRate;
                
                // 更新界面
                updateSpeedDisplay();
                
                // 更新选项状态
                document.querySelectorAll('.speed-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                this.classList.add('active');
                
                // 关闭菜单
                speedMenu.classList.remove('active');
                speedToggle.classList.remove('active');
            });
        });
        
        // 点击页面其他地方关闭倍速菜单
        document.addEventListener('click', function() {
            speedMenu.classList.remove('active');
            speedToggle.classList.remove('active');
        });
        
        // 阻止菜单内部点击事件冒泡
        speedMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // 加载指定索引的歌曲
    function loadTrack(index) {
        if (index < 0 || index >= playlist.length) return;
        
        currentTrackIndex = index;
        const track = playlist[index];
        
        // 更新音频源
        audioPlayer.src = track.url;
        audioPlayer.load();
        
        // 更新界面显示
        albumCover.src = track.cover;
        musicTitle.textContent = track.title;
        musicArtist.textContent = track.artist;
        musicAlbum.textContent = track.album || '';
        
        // 更新播放列表高亮
        updatePlaylistHighlight();
        
        // 如果当前是播放状态，开始播放
        if (isPlaying) {
            audioPlayer.play().catch(e => console.log('播放失败:', e));
        }

        audioPlayer.playbackRate = playbackRate;
        
        // 更新播放按钮
        updatePlayPauseButton(isPlaying);
    }
    
    // 切换播放/暂停
    function togglePlayPause() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            isPlaying = true;
        } else {
            audioPlayer.pause();
            isPlaying = false;
        }
    }

    // 更新倍速显示
    function updateSpeedDisplay() {
        // 根据playbackRate的值选择合适的显示方式
        // 直接使用原始值，不进行四舍五入，保持1.25和1.75的正确显示
        if (playbackRate === 1.25 || playbackRate === 1.75 || 
            playbackRate === 0.75 || playbackRate === 1.5) {
            // 对于有两位小数的倍速，显示两位小数
            speedDisplay.textContent = playbackRate.toFixed(2) + 'x';
        } else if (playbackRate === 0.5 || playbackRate === 1.0 || playbackRate === 2.0) {
            // 对于一位小数或整数的倍速，显示一位小数
            speedDisplay.textContent = playbackRate.toFixed(1) + 'x';
        } else {
            // 其他情况显示两位小数
            speedDisplay.textContent = playbackRate.toFixed(2) + 'x';
        }
    }
    
    // 更新播放/暂停按钮
    function updatePlayPauseButton(playing) {
        const icon = playPauseBtn.querySelector('i');
        if (playing) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    // 播放上一曲
    function playPrevious() {
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = playlist.length - 1;
        }
        loadTrack(newIndex);
        
        if (isPlaying) {
            audioPlayer.play();
        }
    }
    
    // 播放下一曲
    function playNext() {
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= playlist.length) {
            newIndex = 0;
        }
        loadTrack(newIndex);
        
        if (isPlaying) {
            audioPlayer.play();
        }
    }
    
    // 歌曲结束处理
    function handleSongEnded() {
        if (repeatMode === 1) {
            // 单曲循环
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else if (repeatMode === 2 || currentTrackIndex < playlist.length - 1) {
            // 列表循环或还有下一首
            playNext();
        }
    }
    
    // 改变重复模式
    function changeRepeatMode() {
        repeatMode = (repeatMode + 1) % 3;
        
        const icon = repeatBtn.querySelector('i');
        switch (repeatMode) {
            case 0: // 不重复
                icon.className = 'fas fa-redo';
                icon.style.color = '';
                break;
            case 1: // 单曲循环
                icon.className = 'fas fa-redo';
                icon.style.color = 'var(--primary-color)';
                break;
            case 2: // 列表循环
                icon.className = 'fas fa-infinity';
                icon.style.color = 'var(--primary-color)';
                break;
        }
    }
    
    // 跳转到指定时间
    function seek(e) {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }
    
    // 拖动进度条
    function handleDrag(e) {
        if (!isDragging) return;
        
        const rect = progressBar.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        
        // 限制在0-1之间
        percent = Math.max(0, Math.min(1, percent));
        
        // 更新进度显示
        progress.style.width = percent * 100 + '%';
        currentTimeEl.textContent = formatTime(percent * audioPlayer.duration);
        
        // 设置音频时间
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }
    
    // 更新进度条
    function updateProgress() {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = percent + '%';
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        }
    }
    
    // 更新总时长
    function updateDuration() {
        if (audioPlayer.duration) {
            durationEl.textContent = formatTime(audioPlayer.duration);
        }
    }
    
    // 改变音量
    function changeVolume(e) {
        const rect = volumeBar.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        
        volume = percent;
        audioPlayer.volume = volume;
        updateVolumeDisplay();
    }
    
    // 切换静音
    function toggleMute() {
        if (audioPlayer.volume > 0) {
            audioPlayer.volume = 0;
            volume = 0;
        } else {
            audioPlayer.volume = 0.7;
            volume = 0.7;
        }
        updateVolumeDisplay();
    }
    
    // 更新音量显示
    function updateVolumeDisplay() {
        volumeLevel.style.width = volume * 100 + '%';
        
        const icon = volumeBtn.querySelector('i');
        if (volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    // 渲染播放列表
    function renderPlaylist() {
        playlistContent.innerHTML = '';
        playlistCount.textContent = `${playlist.length}首歌曲`;
        
        playlist.forEach((music, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === currentTrackIndex) {
                item.classList.add('active');
            }
            item.dataset.index = index;
            
            item.innerHTML = `
                <div class="playlist-item-index">${index + 1}</div>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${music.title}</div>
                    <div class="playlist-item-artist">${music.artist}</div>
                </div>
                <div class="playlist-item-duration">${formatTime(music.duration)}</div>
            `;
            
            item.addEventListener('click', () => {
                loadTrack(index);
                if (isPlaying) {
                    audioPlayer.play();
                }
            });
            
            playlistContent.appendChild(item);
        });
    }
    
    // 更新播放列表高亮
    function updatePlaylistHighlight() {
        const items = playlistContent.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            if (index === currentTrackIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // 显示时间跳转对话框
    function showTimeJumpDialog() {
        if (!audioPlayer.duration) return;
        
        // 获取当前时间（分和秒）
        const currentTime = audioPlayer.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        
        // 设置输入框的值
        jumpMinuteInput.value = minutes;
        jumpSecondInput.value = seconds;
        
        // 显示对话框
        timeJumpDialog.classList.add('active');
    }
    
    // 隐藏时间跳转对话框
    function hideTimeJumpDialog() {
        timeJumpDialog.classList.remove('active');
    }
    
    // 跳转到指定时间
    function jumpToTime() {
        const minutes = parseInt(jumpMinuteInput.value) || 0;
        const seconds = parseInt(jumpSecondInput.value) || 0;
        
        // 计算总秒数
        const totalSeconds = minutes * 60 + seconds;
        
        // 确保时间在有效范围内
        if (totalSeconds >= 0 && totalSeconds <= audioPlayer.duration) {
            audioPlayer.currentTime = totalSeconds;
        }
        
        // 隐藏对话框
        hideTimeJumpDialog();
    }
    
    // 格式化时间(秒 -> 分:秒)
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // 添加旋转动画到样式表
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});