const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

class ThemeManager {
    constructor() {
        this.theme = this.getInitialTheme();
        this.themeToggle = $('#theme-toggle');
        this.init();
    }

    getInitialTheme() {
        /**
         * Retrieves the initial theme preference from local storage or system settings.
         *
         * @returns {string} The initial theme ('dark' or 'light').
         */
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    init() {
        /**
         * Initializes the theme manager by applying the theme, setting up the toggle, and watching system preferences.
         */
        this.applyTheme(this.theme);
        this.setupToggle();
        this.watchSystemPreference();
    }

    applyTheme(theme) {
        /**
         * Applies the specified theme to the document.
         *
         * @param {string} theme - The theme to apply ('dark' or 'light').
         */
        const html = document.documentElement;

        if (theme === 'dark') {
            html.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            html.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }

        if (this.themeToggle) {
            this.themeToggle.setAttribute('aria-pressed', theme === 'dark');
        }

        localStorage.setItem('theme', theme);
        this.theme = theme;

        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
    }

    setupToggle() {
        /**
         * Sets up the theme toggle button event listeners.
         */
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        this.themeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        /**
         * Toggles the theme between 'light' and 'dark'.
         */
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);

        if (this.themeToggle) {
            this.themeToggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.themeToggle.style.transform = '';
            }, 150);
        }
    }

    watchSystemPreference() {
        /**
         * Watches for changes in the system's preferred color scheme.
         */
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

class AnimationObserver {
    constructor() {
        this.observedElements = new Set();
        this.animationQueue = [];
        this.isProcessingQueue = false;
        this.init();
    }

    init() {
        /**
         * Initializes the animation observer by creating the observer, observing elements, and setting up scroll and parallax animations.
         */
        this.createObserver();
        this.observeElements();
        this.setupScrollAnimations();
        this.setupParallaxEffects();

        window.addEventListener('nca:contentUpdated', () => this.observeNewElements());

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    createObserver() {
        /**
         * Creates the IntersectionObserver instance.
         */
        const options = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: [0.1, 0.3, 0.5]
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.queueAnimation(entry.target);
                }
            });
        }, options);
    }

    queueAnimation(element) {
        /**
         * Queues an element for animation.
         *
         * @param {HTMLElement} element - The element to queue.
         */
        this.animationQueue.push(element);
        if (!this.isProcessingQueue) {
            this.processAnimationQueue();
        }
    }

    async processAnimationQueue() {
        /**
         * Processes the animation queue by animating each element in the queue.
         */
        this.isProcessingQueue = true;

        while (this.animationQueue.length > 0) {
            const element = this.animationQueue.shift();
            await this.animateElement(element);
            await this.delay(50);
        }

        this.isProcessingQueue = false;
    }

    async animateElement(element) {
        /**
         * Animates a single element.
         *
         * @param {HTMLElement} element - The element to animate.
         * @returns {Promise<void>} A promise that resolves when the animation is complete.
         */
        return new Promise((resolve) => {
            element.classList.add('revealed');

            if (element.classList.contains('card')) {
                this.addCardAnimation(element);
            }

            if (element.classList.contains('gradient-text')) {
                this.addTextShimmer(element);
            }

            this.observer.unobserve(element);

            setTimeout(resolve, 300);
        });
    }

    addCardAnimation(card) {
        /**
         * Adds animation effects to a card element.
         *
         * @param {HTMLElement} card - The card element.
         */
        card.style.transform = 'translateY(0) scale(1)';
        card.style.opacity = '1';

        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('card-animating')) {
                card.classList.add('card-animating');
                setTimeout(() => card.classList.remove('card-animating'), 300);
            }
        });
    }

    addTextShimmer(textElement) {
        /**
         * Adds shimmer effect to a text element.
         *
         * @param {HTMLElement} textElement - The text element.
         */
        textElement.style.backgroundSize = '200% 100%';
        textElement.style.animation = 'gradientShift 3s ease infinite';
    }

    observeElements() {
        /**
         * Observes elements with the 'reveal' and 'card' classes for animation.
         */
        $$('.reveal').forEach((el, index) => {
            if (!this.observedElements.has(el)) {
                el.style.transitionDelay = `${index * 50}ms`;
                this.observer.observe(el);
                this.observedElements.add(el);
            }
        });

        $$('.card').forEach((el, index) => {
            if (!this.observedElements.has(el)) {
                el.style.transitionDelay = `${index * 100}ms`;
                this.observer.observe(el);
                this.observedElements.add(el);
            }
        });
    }

    observeNewElements() {
        /**
         * Observes new elements with the 'reveal' class that have not yet been revealed.
         */
        $$('.reveal:not(.revealed)').forEach((el) => {
            if (!this.observedElements.has(el)) {
                this.observer.observe(el);
                this.observedElements.add(el);
            }
        });
    }

    delay(ms) {
        /**
         * Creates a promise that resolves after a specified number of milliseconds.
         *
         * @param {number} ms - The number of milliseconds to delay.
         * @returns {Promise<void>} A promise that resolves after the delay.
         */
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    pauseAnimations() {
        /**
         * Pauses all CSS animations by setting transition durations to 0ms.
         */
        document.documentElement.style.setProperty('--transition-fast', '0ms');
        document.documentElement.style.setProperty('--transition-normal', '0ms');
        document.documentElement.style.setProperty('--transition-slow', '0ms');
    }

    resumeAnimations() {
        /**
         * Resumes CSS animations by restoring the original transition durations.
         */
        document.documentElement.style.setProperty('--transition-fast', '150ms');
        document.documentElement.style.setProperty('--transition-normal', '250ms');
        document.documentElement.style.setProperty('--transition-slow', '350ms');
    }

    setupParallaxEffects() {
        /**
         * Sets up parallax scrolling effects for elements with the 'data-parallax' attribute.
         */
        const parallaxElements = $$('[data-parallax]');

        if (parallaxElements.length === 0) return;

        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.scrollY;

            parallaxElements.forEach(el => {
                const rate = scrolled * (el.dataset.parallax || 0.5);
                el.style.transform = `translateY(${rate}px)`;
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    setupScrollAnimations() {
        /**
         * Sets up scroll-based animations for the navbar.
         */
        const navbar = $('#navbar');

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (navbar) {
                if (currentScrollY > 50) {
                    navbar.classList.add('shadow-lg');
                } else {
                    navbar.classList.remove('shadow-lg');
                }

                navbar.style.position = 'fixed';
                navbar.style.top = '1rem';
                navbar.style.left = '50%';
                navbar.style.transform = 'translateX(-50%)';
                navbar.style.zIndex = '50';
            }
        };

        handleScroll();

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
}

class DiscordIntegration {
    constructor() {
        this.serverId = '1350840224028164096';
        // Multiple CORS proxies for better reliability
        this.proxies = [
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?',
            'https://api.allorigins.win/get?url=',
            'direct'
        ];
        this.currentProxyIndex = 0;
        this.baseUrl = `https://discord.com/api/guilds/${this.serverId}/widget.json`;
        this.apiUrl = this.getProxyUrl();
        this.refreshInterval = 20000;
        this.retryAttempts = 3;
        this.retryDelay = 2000;
        this.lastUpdateTime = null;
        this.refreshTimer = null;
        this.cache = new Map();
        this.cacheExpiry = 60000;
        this.connectionStatus = 'connecting';
        this.consecutiveFailures = 0;
        this.init();
    }

    init() {
        /**
         * Initializes the Discord integration by setting up elements, handling visibility and network changes, loading cached data, and starting auto-refresh.
         */
        this.setupElements();
        this.setupVisibilityHandling();
        this.setupNetworkHandling();
        this.loadCachedData();
        setTimeout(() => this.fetchData(), 100);
        this.startAutoRefresh();
        this.setupRefreshButton();
    }

    setupVisibilityHandling() {
        /**
         * Sets up event listeners to handle changes in document visibility.
         */
        document.addEventListener('visibilitychange', () => {
            this.isActive = !document.hidden;

            if (this.isActive) {
                this.startAutoRefresh(true);
                this.fetchData();
            } else {
                this.startAutoRefresh(false);
            }
        });
    }

    setupNetworkHandling() {
        /**
         * Sets up event listeners to handle changes in network connection status.
         */
        window.addEventListener('online', () => {
            console.log('🌐 Network connection restored');
            this.connectionStatus = 'connecting';
            this.consecutiveFailures = 0;
            this.fetchData();
        });

        window.addEventListener('offline', () => {
            console.log('🌐 Network connection lost');
            this.connectionStatus = 'offline';
            this.showConnectionStatus(false, 'Offline - using cached data');
        });
    }

    loadCachedData() {
        /**
         * Loads cached Discord data from local storage.
         */
        try {
            const cachedData = localStorage.getItem('nca_discord_cache');
            const cacheTimestamp = localStorage.getItem('nca_discord_cache_timestamp');

            if (cachedData && cacheTimestamp) {
                const age = Date.now() - parseInt(cacheTimestamp);
                if (age < this.cacheExpiry * 2) {
                    const data = JSON.parse(cachedData);
                    this.processData(data, true);
                    console.log('Loaded cached Discord data');
                }
            }
        } catch (error) {
            console.warn('Failed to load cached data:', error);
        }
    }

    saveToCache(data) {
        /**
         * Saves Discord data to local storage.
         *
         * @param {object} data - The Discord data to save.
         */
        try {
            localStorage.setItem('nca_discord_cache', JSON.stringify(data));
            localStorage.setItem('nca_discord_cache_timestamp', Date.now().toString());
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }

    getProxyUrl() {
        /**
         * Gets the current proxy URL for the Discord API.
         * @returns {string} The proxy URL.
         */
        const proxy = this.proxies[this.currentProxyIndex];
        if (proxy === 'direct') {
            return this.baseUrl;
        } else if (proxy.includes('allorigins.win')) {
            return `${proxy}${encodeURIComponent(this.baseUrl)}`;
        } else {
            return `${proxy}${encodeURIComponent(this.baseUrl)}`;
        }
    }

    switchToNextProxy() {
        /**
         * Switches to the next available proxy.
         */
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
        this.apiUrl = this.getProxyUrl();
        console.log(`Switching to proxy: ${this.proxies[this.currentProxyIndex]}`);
    }

    setupElements() {
        /**
         * Sets up references to DOM elements used by the Discord integration.
         */
        this.elements = {
            totalMembers: $('#total-members'),
            totalMembersHero: $('#total-members-hero'),
            onlineMembers: $('#online-members'),
            onlineMembersHero: $('#online-members-hero'),
            memberCount: $('#member-count'),
            membersGrid: $('#members-grid'),
            lastUpdated: $('#last-updated'),
            refreshButton: $('#refresh-data')
        };
    }

    async fetchData(attempt = 1, skipCache = false) {
        /**
         * Fetches data from the Discord API.
         *
         * @param {number} attempt - The current attempt number.
         * @param {boolean} skipCache - Whether to skip the cache.
         */
        if (!navigator.onLine) {
            console.log('Offline - using cached data');
            return;
        }

        if (!skipCache && this.isCacheValid()) {
            console.log('Using cached data (still valid)');
            return;
        }

        try {
            this.showLoadingState();
            this.connectionStatus = 'connecting';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(this.apiUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            let data;

            try {
                const proxyData = JSON.parse(responseText);
                if (this.proxies[this.currentProxyIndex] === 'direct') {
                    data = proxyData;
                } else if (proxyData.contents) {
                    data = JSON.parse(proxyData.contents);
                } else if (proxyData.status && proxyData.status.url) {
                    data = proxyData;
                } else {
                    data = proxyData;
                }
            } catch (parseError) {
                data = JSON.parse(responseText);
            }

            if (!this.validateDiscordData(data)) {
                throw new Error('Invalid data structure received from Discord API');
            }

            this.processData(data);
            this.saveToCache(data);
            this.connectionStatus = 'connected';
            this.consecutiveFailures = 0;
            this.showConnectionStatus(true, 'Live data updated');

        } catch (error) {
            this.consecutiveFailures++;
            console.error(`Discord API fetch attempt ${attempt} failed using ${this.proxies[this.currentProxyIndex]}:`, error);

            if (attempt < this.retryAttempts) {
                if (attempt > 1) {
                    this.switchToNextProxy();
                }
                
                const delay = this.retryDelay * attempt;
                console.log(`Retrying in ${delay}ms with ${this.proxies[this.currentProxyIndex]}...`);

                setTimeout(() => {
                    this.fetchData(attempt + 1, skipCache);
                }, delay);
            } else {
                console.warn('All proxy attempts failed, falling back to cached data');
                this.connectionStatus = 'failed';
                this.handleFetchFailure();
            }
        }
    }

    isCacheValid() {
        /**
         * Checks if the cached data is still valid.
         *
         * @returns {boolean} True if the cache is valid, false otherwise.
         */
        const cacheTimestamp = localStorage.getItem('nca_discord_cache_timestamp');
        if (!cacheTimestamp) return false;

        const age = Date.now() - parseInt(cacheTimestamp);
        return age < this.cacheExpiry;
    }

    validateDiscordData(data) {
        /**
         * Validates the structure of the Discord data.
         *
         * @param {object} data - The Discord data to validate.
         * @returns {boolean} True if the data is valid, false otherwise.
         */
        return data &&
            typeof data === 'object' &&
            typeof data.presence_count === 'number' &&
            Array.isArray(data.members);
    }

    handleFetchFailure() {
        /**
         * Handles a failure to fetch data from the Discord API.
         */
        if (this.consecutiveFailures >= this.retryAttempts) {
            const cachedData = localStorage.getItem('nca_discord_cache');
            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    this.processData(data, true);
                    this.showConnectionStatus(false, 'Using cached data - connection failed');
                    return;
                } catch (error) {
                    console.warn('Failed to parse cached data:', error);
                }
            }
        }

        this.showFallbackData();
        this.showConnectionStatus(false, 'Connection failed - showing fallback data');
    }

    processData(data, isFromCache = false) {
        /**
         * Processes the Discord data and updates the UI.
         *
         * @param {object} data - The Discord data to process.
         * @param {boolean} isFromCache - Whether the data is from the cache.
         */
        const onlineMembers = data.presence_count || 0;

        this.animateNumber(this.elements.onlineMembers, onlineMembers);
        this.animateNumber(this.elements.onlineMembersHero, onlineMembers);

        if (this.elements.memberCount) {
            const cacheIndicator = isFromCache ? ' (cached)' : '';
            this.elements.memberCount.textContent = `${onlineMembers} members online${cacheIndicator}`;
        }

        if (this.elements.membersGrid && data.members) {
            this.displayMembers(data.members, isFromCache);
        } else if (this.elements.membersGrid) {
            this.elements.membersGrid.innerHTML = '<p class="col-span-full text-center text-text-tertiary">Could not load member list.</p>';
        }

        this.lastUpdateTime = isFromCache ? new Date(parseInt(localStorage.getItem('nca_discord_cache_timestamp'))) : new Date();
        this.updateLastUpdated(isFromCache);

        if (!isFromCache) {
            this.showConnectionStatus(true, 'Live data updated');
        }
    }

    animateNumber(element, targetNumber, duration = 1000) {
        /**
         * Animates a number from its current value to a target value.
         *
         * @param {HTMLElement} element - The element to animate.
         * @param {number} targetNumber - The target number.
         * @param {number} duration - The duration of the animation in milliseconds.
         */
        if (!element) return;

        const shimmerSpan = element.querySelector('.shimmer');
        if (shimmerSpan) {
            shimmerSpan.remove();
        }

        const startNumber = parseInt(element.textContent) || 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentNumber = Math.round(startNumber + (targetNumber - startNumber) * easeOutCubic);

            element.textContent = currentNumber.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    showLoadingState() {
        /**
         * Shows a loading state in the members grid.
         */
        if (!this.elements.membersGrid) return;

        this.elements.membersGrid.innerHTML = '';

        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-grid';

        for (let i = 0; i < 20; i++) {
            const loadingCard = document.createElement('div');
            loadingCard.className = 'loading-skeleton loading-member-card';
            loadingContainer.appendChild(loadingCard);
        }

        this.elements.membersGrid.appendChild(loadingContainer);

        if (this.elements.memberCount) {
            this.elements.memberCount.textContent = 'Loading members...';
        }
    }

    displayMembers(members, isFromCache = false) {
        /**
         * Displays the members in the members grid.
         *
         * @param {array} members - The array of member objects.
         * @param {boolean} isFromCache - Whether the data is from the cache.
         */
        if (!this.elements.membersGrid) return;

        this.elements.membersGrid.innerHTML = '';

        const statusPriority = { 'online': 1, 'idle': 2, 'dnd': 3, 'offline': 4 };

        const sortedMembers = members.sort((a, b) => {
            return (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
        });

        const maxMembers = Math.min(sortedMembers.length, 50);
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < maxMembers; i++) {
            const memberCard = this.createMemberCard(sortedMembers[i], i, isFromCache);
            fragment.appendChild(memberCard);
        }

        this.elements.membersGrid.appendChild(fragment);

        if (isFromCache && maxMembers > 0) {
            const cacheIndicator = document.createElement('div');
            cacheIndicator.className = 'col-span-full text-center text-xs text-text-muted mt-4';
            cacheIndicator.textContent = 'Showing cached member data';
            this.elements.membersGrid.appendChild(cacheIndicator);
        }

        window.dispatchEvent(new CustomEvent('nca:contentUpdated'));
    }

    createMemberCard(member, index) {
        /**
         * Creates a member card element.
         *
         * @param {object} member - The member object.
         * @param {number} index - The index of the member.
         * @returns {HTMLElement} The member card element.
         */
        const card = document.createElement('a');
        card.className = 'relative w-16 h-16 group reveal';
        card.href = '#';
        card.style.animationDelay = `${index * 30}ms`;
        card.setAttribute('aria-label', member.username);

        const statusClass = this.getStatusClass(member.status);

        card.innerHTML = `
            <img src="${member.avatar_url}" 
                 alt="${member.username}" 
                 class="w-full h-full rounded-2xl object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl shadow-lg bg-dark-700">
            <div class="absolute -bottom-1 -right-1 status-indicator ${statusClass}" title="${member.status}"></div>
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-center p-1 rounded-2xl">
                <span class="text-white text-xs font-bold truncate">${member.username}</span>
            </div>
        `;
        return card;
    }

    getStatusClass(status) {
        /**
         * Gets the CSS class for a member's status.
         *
         * @param {string} status - The member's status.
         * @returns {string} The CSS class for the status.
         */
        const statusMap = {
            'online': 'status-online',
            'idle': 'status-idle',
            'dnd': 'status-dnd',
            'offline': 'status-offline'
        };
        return statusMap[status] || 'status-offline';
    }

    showLoadingState() {
        /**
         * Shows a loading state for online members.
         */
        if (this.elements.onlineMembers && !this.elements.onlineMembers.querySelector('.shimmer')) {
            this.elements.onlineMembers.innerHTML = '<span class="shimmer">---</span>';
        }
        if (this.elements.onlineMembersHero && !this.elements.onlineMembersHero.querySelector('.shimmer')) {
            this.elements.onlineMembersHero.innerHTML = '<span class="shimmer">---</span>';
        }
        if (this.elements.membersGrid) {
            let placeholders = '';
            for (let i = 0; i < 20; i++) {
                placeholders += `
                    <div class="relative w-16 h-16 bg-dark-700 rounded-2xl shimmer"></div>
                `;
            }
            this.elements.membersGrid.innerHTML = placeholders;
        }
    }

    showFallbackData() {
        /**
         * Shows fallback data if the Discord API is unavailable.
         */
        const fallbackOnline = 248;
        this.animateNumber(this.elements.onlineMembers, fallbackOnline);
        this.animateNumber(this.elements.onlineMembersHero, fallbackOnline);
        if (this.elements.memberCount) {
            this.elements.memberCount.textContent = 'Could not load live data.';
        }
        if (this.elements.membersGrid) {
            this.elements.membersGrid.innerHTML = '<p class="col-span-full text-center">Could not load member list.</p>';
        }
    }

    showConnectionStatus(isConnected, message = '') {
        /**
         * Shows the connection status indicator.
         *
         * @param {boolean} isConnected - Whether the connection is established.
         * @param {string} message - The message to display.
         */
        let indicator = $('.connection-status');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'connection-status fixed top-24 right-4 z-[100] px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shadow-lg';
            document.body.appendChild(indicator);
        }

        if (isConnected) {
            indicator.className += ' bg-discord-success text-white';
            indicator.textContent = message || 'Live';
        } else {
            indicator.className += ' bg-discord-danger text-white';
            indicator.textContent = message || 'Offline';
        }

        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(-20px)';
        }, 4000);
    }

    updateLastUpdated(isFromCache = false) {
        /**
         * Updates the last updated timestamp.
         *
         * @param {boolean} isFromCache - Whether the data is from the cache.
         */
        if (this.elements.lastUpdated) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            this.elements.lastUpdated.textContent = `Last updated: ${timeString}`;
        }
    }

    setupRefreshButton() {
        /**
         * Sets up the refresh button event listener.
         */
        if (this.elements.refreshButton) {
            this.elements.refreshButton.addEventListener('click', () => {
                this.fetchData();

                const icon = this.elements.refreshButton.querySelector('svg');
                if (icon) {
                    icon.style.transform = 'rotate(360deg)';
                    setTimeout(() => {
                        icon.style.transform = '';
                    }, 500);
                }
            });
        }
    }

    startAutoRefresh(isActive = true) {
        /**
         * Starts the auto-refresh timer.
         *
         * @param {boolean} isActive - Whether the tab is currently active.
         */
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        const interval = isActive ? 10000 : this.refreshInterval;

        this.refreshTimer = setInterval(() => {
            if (!document.hidden && navigator.onLine) {
                const skipCache = this.consecutiveFailures > 0 ||
                    (this.lastUpdateTime && Date.now() - this.lastUpdateTime.getTime() > this.refreshInterval * 2);
                this.fetchData(1, skipCache);
            }
        }, interval);

        console.log(`Auto-refresh ${isActive ? 'fast' : 'normal'} mode: ${interval}ms`);
    }

    refreshData() {
        /**
         * Manually refreshes the Discord data.
         */
        console.log('Manual refresh triggered');
        this.currentProxyIndex = 0;
        this.apiUrl = this.getProxyUrl();
        this.consecutiveFailures = 0;
        this.fetchData(1, true);
    }

    destroy() {
        /**
         * Cleans up resources when the component is destroyed.
         */
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

class SmoothScrolling {
    constructor() {
        this.init();
    }

    init() {
        /**
         * Initializes the smooth scrolling functionality.
         */
        this.setupNavLinks();
    }

    setupNavLinks() {
        /**
         * Sets up event listeners for navigation links to enable smooth scrolling.
         */
        $$('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                e.preventDefault();
                const target = $(targetId);

                if (target) {
                    this.scrollToElement(target);
                }
            });
        });
    }

    scrollToElement(element, offset = 80) {
        /**
         * Scrolls to a specified element with a smooth animation.
         *
         * @param {HTMLElement} element - The element to scroll to.
         * @param {number} offset - The offset from the top of the element.
         */
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

class PerformanceOptimizer {
    constructor() {
        this.imageCache = new Map();
        this.lazyImages = [];
        this.isIntersectionObserverSupported = 'IntersectionObserver' in window;
        this.init();
    }

    init() {
        /**
         * Initializes the performance optimizer by setting up various optimizations.
         */
        this.optimizeAnimations();
        this.preloadCriticalResources();
        this.setupLazyLoading();
        this.optimizeScrollPerformance();
        this.setupResourceHints();
        this.monitorPerformance();
    }

    optimizeAnimations() {
        /**
         * Optimizes animations based on user preferences and device capabilities.
         */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-normal', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');

            $$('[class*="animate-"]').forEach(el => {
                el.style.animation = 'none';
            });
        }

        if (this.isLowEndDevice()) {
            document.documentElement.classList.add('low-performance');
            this.reducedAnimations();
        }
    }

    isLowEndDevice() {
        /**
         * Detects if the device is low-end based on memory, cores, and network connection.
         *
         * @returns {boolean} True if the device is low-end, false otherwise.
         */
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const memory = navigator.deviceMemory;
        const cores = navigator.hardwareConcurrency;

        return (
            (memory && memory < 4) ||
            (cores && cores < 4) ||
            (connection && connection.effectiveType && connection.effectiveType.includes('2g'))
        );
    }

    reducedAnimations() {
        /**
         * Reduces animation complexity for low-end devices.
         */
        document.documentElement.style.setProperty('--transition-fast', '100ms');
        document.documentElement.style.setProperty('--transition-normal', '150ms');
        document.documentElement.style.setProperty('--transition-slow', '200ms');
        $$('.gradient-hero, .gradient-text').forEach(el => {
            el.style.backgroundSize = '100% 100%';
            el.style.animation = 'none';
        });
    }

    preloadCriticalResources() {
        /**
         * Preloads critical images and CSS resources to improve initial load time.
         */
        const criticalImages = [
            'https://cdn.discordapp.com/icons/1350840224028164096/aef451a6fd0d8c89d725c8971c5b192b.png?size=512',
            'https://cdn.discordapp.com/icons/1350840224028164096/aef451a6fd0d8c89d725c8971c5b192b.png?size=256',
            'https://cdn.discordapp.com/icons/1350840224028164096/aef451a6fd0d8c89d725c8971c5b192b.png?size=64'
        ];

        criticalImages.forEach(src => {
            if (!this.imageCache.has(src)) {
                const img = new Image();
                img.src = src;
                this.imageCache.set(src, img);
            }
        });

        this.preloadCSS();
    }

    preloadCSS() {
        /**
         * Preloads additional CSS files to prevent render-blocking.
         */
        const additionalCSS = [];

        additionalCSS.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = href;
            document.head.appendChild(link);
        });
    }

    setupLazyLoading() {
        /**
         * Sets up lazy loading for images using IntersectionObserver for performance.
         */
        if (!this.isIntersectionObserverSupported) {
            this.loadAllImages();
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        $$('img[data-src]').forEach(img => {
            imageObserver.observe(img);
            this.lazyImages.push(img);
        });
    }

    loadImage(img) {
        /**
         * Loads an image by setting its source and updating its class.
         *
         * @param {HTMLImageElement} img - The image element to load.
         */
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        }
    }

    loadAllImages() {
        /**
         * Loads all images with 'data-src' attribute (fallback for older browsers).
         */
        $$('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }

    optimizeScrollPerformance() {
        /**
         * Optimizes scroll performance using passive event listeners and requestAnimationFrame.
         */
        let ticking = false;

        const optimizedScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250), { passive: true });
    }

    handleScroll() {
        /**
         * Handles scroll events to update parallax elements efficiently.
         */
        const scrollY = window.scrollY;

        $$('[data-parallax]').forEach(el => {
            const rate = parseFloat(el.dataset.parallax) || 0.5;
            const yPos = -(scrollY * rate);
            el.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    }

    handleResize() {
        /**
         * Handles resize events to optimize for the current viewport.
         */
        this.optimizeForViewport();
    }

    optimizeForViewport() {
        /**
         * Optimizes performance based on the viewport width.
         */
        const width = window.innerWidth;

        if (width < 768) {
            document.documentElement.classList.add('mobile-optimized');
        } else {
            document.documentElement.classList.remove('mobile-optimized');
        }
    }

    setupResourceHints() {
        /**
         * Adds DNS prefetch resource hints for external domains.
         */
        const externalDomains = [
            'fonts.googleapis.com',
            'cdn.discordapp.com'
        ];

        externalDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }

    monitorPerformance() {
        /**
         * Monitors performance metrics using PerformanceObserver and memory usage.
         */
        if ('performance' in window && 'PerformanceObserver' in window) {
            this.setupPerformanceObserver();
        }

        if ('memory' in performance) {
            this.monitorMemoryUsage();
        }
    }

    setupPerformanceObserver() {
        /**
         * Sets up a PerformanceObserver to monitor LCP and FID.
         */
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        console.log('LCP:', entry.startTime);
                    }
                    if (entry.entryType === 'first-input') {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    }
                });
            });

            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        } catch (error) {
            console.warn('Performance Observer not supported:', error);
        }
    }

    monitorMemoryUsage() {
        /**
         * Monitors memory usage and triggers optimization if usage is high.
         */
        const checkMemory = () => {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

            if (usedMB / limitMB > 0.8) {
                console.warn('High memory usage detected:', usedMB, 'MB of', limitMB, 'MB');
                this.optimizeMemoryUsage();
            }
        };

        setInterval(checkMemory, 30000);
    }

    optimizeMemoryUsage() {
        /**
         * Optimizes memory usage by clearing the image cache and triggering garbage collection.
         */
        if (this.imageCache.size > 10) {
            this.imageCache.clear();
        }

        if (window.gc) {
            window.gc();
        }
    }

    debounce(func, wait) {
        /**
         * Debounces a function to prevent it from being called too frequently.
         *
         * @param {function} func - The function to debounce.
         * @param {number} wait - The number of milliseconds to wait before calling the function.
         * @returns {function} A debounced version of the function.
         */
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

class NCAWebsite {
    /**
     * Initializes the NCA Website with all its components.
     */
    constructor() {
        this.components = {};
        this.init();
    }

    async init() {
        /**
         * Initializes the NCA Website components.
         */
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        try {
            this.components.performance = new PerformanceOptimizer();
            this.components.theme = new ThemeManager();
            this.components.animations = new AnimationObserver();
            this.components.scrolling = new SmoothScrolling();
            this.components.discord = new DiscordIntegration();

            console.log('🎉 NCA Website initialized successfully');

            this.setupErrorHandling();

        } catch (error) {
            console.error('❌ Failed to initialize NCA Website:', error);
        }
    }

    setupErrorHandling() {
        /**
         * Sets up global error handling for the application.
         */
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    getComponent(name) {
        /**
         * Retrieves a component by its name.
         *
         * @param {string} name - The name of the component.
         * @returns {object} The component instance.
         */
        return this.components[name];
    }
}

window.NCA = new NCAWebsite();

window.addEventListener('load', () => {
    if (window.NCA && window.NCA.components && window.NCA.components.discord) {
        window.NCA.DiscordIntegration = window.NCA.components.discord;
    }
});
