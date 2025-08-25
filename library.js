builder.add('widgets','services', class extends builder.ComponentClass {

    _init(){
        this._properties = {
            class: {},
            data: {},
            default: {},
            targetTable: null,
            targetId: null,
            interval: 10000,
            autoStart: false,
            callback: {},
        };
        this._services = {};
        this._counter = 0;
        this._interval = null;
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'services' + this._id,
            'class': 'services-feed',
        });
        this._component.id = this._component.attr('id');

        // Set Component Class
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }

        // Create a controls container
        this._component.controls = $(document.createElement('div')).addClass('services-controls').prependTo(this._component);
        this._component.controls.group = $(document.createElement('div')).addClass('btn-group').appendTo(this._component.controls);
        this._component.controls.group.add = $(document.createElement('button')).attr({
            'class': 'btn btn-success',
            'data-action': 'add',
            'type': 'button',
        }).html('<i class="bi bi-plus-lg"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.grid = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'grid',
            'type': 'button',
        }).html('<i class="bi bi-grid-3x3-gap"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.list = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'list',
            'type': 'button',
        }).html('<i class="bi bi-list"></i>').appendTo(this._component.controls.group);

        // Create a search container
        this._component.search = $(document.createElement('input')).attr({
            'class': 'form-control',
            'type': 'search',
            'placeholder': this._builder.Locale.get('Search...'),
        }).prependTo(this._component.controls);
        this._component.search.on('input', function(){
            const search = this.value.toLowerCase();
            self._component.container.children('.col').each(function(){
                const content = $(this).text().toLowerCase();
                if(content.includes(search)){
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });

        // Create a container for the services
        this._component.container = $(document.createElement('div')).addClass('services-container').appendTo(this._component);
        this._component.container.on('click', '.controls, .controls *', function (e) {
            e.stopPropagation();
        });

        // Load the state
        this.loadState();

        // Add Event Listeners
        this._component.controls.group.add.click(function(){
            self.create();
        });
        this._component.controls.group.grid.click(function(){

            // Set the grid view
            self._component.container.removeClass('list-view').addClass('grid-view');
            self._component.controls.group.grid.addClass('active');
            self._component.controls.group.list.removeClass('active');

            // Save the state
            self.saveState();
        });
        this._component.controls.group.list.click(function(){

            // Set the list view
            self._component.container.removeClass('grid-view').addClass('list-view');
            self._component.controls.group.list.addClass('active');
            self._component.controls.group.grid.removeClass('active');

            // Save the state
            self.saveState();
        });

        // Add existing Contacts
        for(const [key, record] of Object.entries(this._properties.data ?? {})){
            this.add(record);
        }

        // Check if we need to auto start the interval
        if(this._properties.autoStart){

            // Start the interval to check for changes
            setTimeout(function(){
                self.start();
            }, this._properties.interval);
        }
    }

    start(){
        // Set Self
        const self = this;

        // Check if the interval is already set
        if(this._interval){
            console.warn('Interval is already set, stopping the previous one.');
            clearInterval(this._interval);
        }

        // Set the interval to check for changes
        this._interval = setInterval(function(){
            self.load();
        }, this._properties.interval);
    }

    stop(){
        // Check if the interval is set
        if(this._interval){
            clearInterval(this._interval);
            this._interval = null;
        } else {
            console.warn('No interval is currently set.');
        }
    }

    stateKey() {

        // include origin, path and query so /page?a=1 and /page?a=2 don't clash
        const url = location.origin + location.pathname + location.search;
        return `services.state::${url}::${this._component.id}`;
    }

    clearState() {

        // Remove persisted state
        localStorage.removeItem(this.stateKey());

        // Reset the view mode
        this._component.container.removeClass('list-view').addClass('grid-view');
    }

    saveState() {

        // Save the current view mode
        const state = {
            view: this._component.container.hasClass('list-view') ? 'list' : 'grid',
        };

        // Persist the state
        localStorage.setItem(this.stateKey(), JSON.stringify(state));
    }

    loadState() {

        // Check for persisted state
        const state = localStorage.getItem(this.stateKey());
        if(state){
            try {
                const parsedState = JSON.parse(state);
                if(parsedState.view === 'list'){
                    // Set the list view
                    this._component.container.removeClass('grid-view').addClass('list-view');
                    this._component.controls.group.list.addClass('active');
                    this._component.controls.group.grid.removeClass('active');
                } else {
                    // Set the grid view
                    this._component.container.removeClass('list-view').addClass('grid-view');
                    this._component.controls.group.grid.addClass('active');
                    this._component.controls.group.list.removeClass('active');
                }
            } catch (e) {
                // If parsing fails, default to grid view
                this._component.container.removeClass('list-view').addClass('grid-view');
                this._component.controls.group.grid.addClass('active');
                this._component.controls.group.list.removeClass('active');
            }
        } else {
            // Default to grid view if no state is found
            this._component.container.removeClass('list-view').addClass('grid-view');
            this._component.controls.group.grid.addClass('active');
            this._component.controls.group.list.removeClass('active');
        }
    }

    load(records = null){

        // Set Self
        const self = this;

        // If records are provided, use them
        if(records !== null && Object.entries(records).length > 0){

            // Add Contacts Posts
            for(const [key, record] of Object.entries(records)){
                self.add(record);
            }
            return this;
        }

        // Retrieve Notes
        $.ajax({
            url: '/api/services/fetchAll',
            headers: {'X-CSRF-Authorization': CSRF_KEY},
            type: 'POST',dataType: 'json',
            data: {
                conditions: [
                    {key: 'targetTable', operator: '=', value: this._properties.targetTable},
                    {key: 'targetId', operator: '=', value: this._properties.targetId},
                    {key: 'isArchived', operator: '<>', value: 1},
                ]
            },
            success: function(response) {

                // Add Contacts Posts
                for(const [key, record] of Object.entries(response.records)){
                    self.add(record);
                }
            }
        });

        return this;
    }

    add(record, param1 = null, param2 = null){

        // Set Self
        const self = this;

        let options = {};
        let callback = null;

        // Set selector, options, and callback
        [param1, param2].forEach(param => {
            if(param !== null){
                if (typeof param === 'object') {
                    options = param;
                } else if (typeof param === 'function') {
                    callback = param;
                }
            }
        });

        let properties = {
            class: {},
            callback: {},
        };

        // Configure Options
        for(const [key, value] of Object.entries(options)){
            if(typeof properties[key] !== 'undefined'){
                switch(key){
                    case"callback":
                        if(typeof properties[key] !== 'undefined'){
                            for(const [k, v] of Object.entries(value)){
                                if(typeof properties[key][k] !== 'undefined'){
                                    properties[key][k] = v;
                                }
                            }
                        }
                        break;
                    case"class":
                        for(const [section, classes] of Object.entries(value)){
                            if(properties[key][section] != null){
                                properties[key][section] += ' ' + classes;
                            } else {
                                properties[key][section] = classes;
                            }
                        }
                        break;
                    default:
                        properties[key] = value;
                        break;
                }
            }
        }

        // Check if the svard already exists
        if(this._services[record.id ?? (this._counter + 1)]){
            this.edit(record.id, record);
            return this;
        }

        // Increment Post Count
        this._counter++;

        // Set ID
        const count = record.id ?? this._counter;
        const id = this._component.id + 'service' + count;

        // Create Column
        let service = $(document.createElement('div')).attr({
            'id':id,
            'class':'col',
            'data-type':'service',
        }).appendTo(this._component.container);
        service.id = service.attr('id');
        service.data = record;

        // Create Card
        service.card = $(document.createElement('div')).addClass('card h-100 card-hover').appendTo(service);
        service.card.body = $(document.createElement('div')).addClass('card-body').appendTo(service.card);

        // Add Service information
        service.card.body.info = $(document.createElement('div')).addClass('d-flex align-items-center gap-3').appendTo(service.card.body);
        service.card.body.info.icon = $(document.createElement('div')).attr({
            'class':'service-icon',
        }).html('<i class="bi bi-box2 fs-4"></i>').appendTo(service.card.body.info);
        service.card.body.info.container = $(document.createElement('div')).addClass('flex-grow-1').appendTo(service.card.body.info);
        service.card.body.info.container.name = $(document.createElement('div')).addClass('d-flex align-items-center gap-2 flex-wrap').text(record.product.name).appendTo(service.card.body.info.container);
        service.card.body.info.container.sbtle = $(document.createElement('div')).addClass('small').appendTo(service.card.body.info.container);
        service.card.body.info.container.sbtle.rate = $(document.createElement('span')).addClass('text-secondary').text(((record.rate ?? 0) * 100)+'%').appendTo(service.card.body.info.container.sbtle);
        service.card.body.badges = $(document.createElement('div')).addClass('mt-2 d-flex flex-wrap gap-2').appendTo(service.card.body);
        for(const [key, commission] of Object.entries(record.commissions ?? {})){
            $(document.createElement('span')).attr({
                'class': 'badge text-bg-light border',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'right',
                'title': (commission.rate * 100) + '%',
                'data-bs-title': (commission.rate * 100) + '%',
            }).html('<i class="bi bi-person me-1"></i>'+commission.user.username).appendTo(service.card.body.badges);
        }

        // Add click event to the card
        service.card.body.click(function(e){
            e.stopPropagation();
            self.edit(record.id);
        });

        // Add downloads button
        service.card.download = $(document.createElement('button')).attr({
            'type': 'button',
            'class': 'btn btn-light'+(record.agreement.name !== null ? '' : ' d-none'),
        }).html('<i class="bi bi-download"></i>').appendTo(service.card);
        service.card.download.hover(function(){
            $(this).removeClass('btn-light').addClass('btn-primary');
        }, function(){
            $(this).removeClass('btn-primary').addClass('btn-light');
        }).click(function(){

            // Create a hidden link element
            const link = document.createElement('a');
            link.href = '/files/get?uuid='+record.agreement.uuid+'&download';
            link.download = record.agreement.name;
            document.body.appendChild(link);

            // Programmatically click the link to trigger the download
            link.click();

            // Remove the link from the document
            document.body.removeChild(link);
        });

        // Add archive button
        service.card.archive = $(document.createElement('button')).attr({
            'type': 'button',
            'class': 'btn btn-light',
        }).html('<i class="bi bi-archive"></i>').appendTo(service.card);
        service.card.archive.hover(function(){
            $(this).removeClass('btn-light').addClass('btn-dark');
        }, function(){
            $(this).removeClass('btn-dark').addClass('btn-light');
        }).click(function(){
            self.archive(record.id, function(){
                delete self._services[count];
                service.remove();
            });
        });

        // Save the vCard in the services object
        this._services[count] = service;

        // return the instance
        return this;
    }

    edit(id, record = null) {

        // Set Self
        const self = this;

        // Check if the service exists
        if(!this._services[id]){
            console.warn('Service with ID ' + id + ' does not exist.');
            return this;
        }

        // Update the service object
        function update(service, record) {
            service.data = record;

            // Update the service information
            service.card.body.info.container.name.text(record.product.name);
            service.card.body.info.container.sbtle.rate.text(((record.rate ?? 0) * 100) + '%');
            service.card.body.badges.empty();
            for(const [key, commission] of Object.entries(record.commissions ?? {})){
                $(document.createElement('span')).attr({
                    'class': 'badge text-bg-light border',
                    'data-bs-toggle': 'tooltip',
                    'data-bs-placement': 'right',
                    'title': (commission.rate * 100) + '%',
                    'data-bs-title': (commission.rate * 100) + '%',
                }).html('<i class="bi bi-person me-1"></i>'+commission.user.username).appendTo(service.card.body.badges);
            }
            if(record.agreement.name !== null){
                service.card.download.removeClass('d-none');
            } else {
                service.card.download.addClass('d-none');
            }
        }

        // Check if record is provided
        if(record === null){

            // Create the Modal
            this._builder.Component(
                "modal",
                {
                    icon: "cash-coin",
                    title: this._builder.Locale.get("Service"),
                    color: 'warning',
                    callback: {
                        load: function(component, modal){
                            return new Promise((resolve, reject) => {
                                try {

                                    // Set the parent
                                    const parent = component.dialog;

                                    // AJAX Request
                                    $.ajax({
                                        url: '/api/services/cap',
                                        headers: {'X-CSRF-Authorization': CSRF_KEY},
                                        type: 'GET',dataType: 'json',
                                        error: function(xhr, status, error) {
                                            console.error('Error fetching commission cap:', error);
                                            reject(new Error(self._builder.Locale.get('Failed to fetch commission cap')));
                                        },
                                        success: function(commissionCap) {
                                            commissionCap = commissionCap.cap;

                                            // AJAX Request
                                            $.ajax({
                                                url: '/api/services/fetch?id=' + id,
                                                headers: {'X-CSRF-Authorization': CSRF_KEY},
                                                type: 'GET',dataType: 'json',
                                                error: function(xhr, status, error) {
                                                    console.error('Error fetching service:', error);
                                                    reject(new Error(self._builder.Locale.get('Failed to fetch service')));
                                                },
                                                success: function(response) {

                                                    // Set the record
                                                    const serviceRecord = response.record;

                                                    // Create the Form
                                                    self._builder.Utility(
                                                        'form',
                                                        component.body,
                                                        {
                                                            callback: {
                                                                val: function(values){
                                                                    values.commissions = [];
                                                                    component.find('[data-rate]').each(function(){
                                                                        const rate = parseFloat($(this).data('rate'));
                                                                        const user = $(this).data('user');
                                                                        if(!isNaN(rate) && user){
                                                                            values.commissions.push({rate: rate, user: user});
                                                                        }
                                                                    });
                                                                    values.rate = (values.rate / 100).toFixed(2);
                                                                    return values;
                                                                },
                                                                submit: function(form){

                                                                    // Show the modal spinner
                                                                    modal.spinner(true);

                                                                    // Create the vCard
                                                                    $.ajax({
                                                                        url: '/api/services/update?id='+serviceRecord.id,
                                                                        headers: {'X-CSRF-Authorization': CSRF_KEY},
                                                                        type: 'POST',dataType: 'json',
                                                                        data: form.val(),
                                                                        success: function(response) {

                                                                            // Add the new vCard to the services
                                                                            update(self._services[id], response.record);

                                                                            // Hide the modal
                                                                            modal.hide();
                                                                        }
                                                                    });
                                                                },
                                                            }
                                                        },
                                                        function(form,component){

                                                            // Add event listener on the modal submit button
                                                            parent.content.footer.submit.click(function(e){
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                form.submit();
                                                            });

                                                            // rate
                                                            form.add(
                                                                'number',
                                                                {
                                                                    name: 'rate',
                                                                    label: self._builder.Locale.get('Rate'),
                                                                    placeholder: self._builder.Locale.get('Enter a rate'),
                                                                    required: true,
                                                                    value: (serviceRecord.rate * 100).toFixed(2),
                                                                    class: {
                                                                        component: 'bg-gray-200 p-3 py-2 rounded-0 border-bottom',
                                                                    },
                                                                },
                                                                function(input){
                                                                    input._component.input.attr({
                                                                        'step':'1',
                                                                        'max':'100',
                                                                        'min':'0',
                                                                    });
                                                                }
                                                            );

                                                            // Calculate the commission cap
                                                            function calc() {
                                                                var cap = commissionCap;
                                                                for(const [key, commission] of Object.entries(form.val().commissions ?? [])){
                                                                    cap -= parseInt((commission.rate * 100).toFixed(0));
                                                                }
                                                                return cap;
                                                            }

                                                            // Add a commission to the component
                                                            function add(commission) {
                                                                const object = $(document.createElement('div')).attr({
                                                                    'class': 'p-3 py-2 rounded-0 border-top d-flex align-items-center',
                                                                    'data-rate': commission.rate,
                                                                    'data-user': commission.user.id,
                                                                }).appendTo(component);
                                                                object.commission = $(document.createElement('div')).text((commission.rate * 100)+'%').addClass('flex-shrink-1 me-2').appendTo(object);
                                                                object.userblock = $(document.createElement('div')).attr({
                                                                    'class': 'flex-grow-1 d-flex align-items-center justify-content-start',
                                                                }).appendTo(object);
                                                                object.userblock.avatar = $(document.createElement('img')).attr({
                                                                    'src': '/avatar?id='+commission.user.vcard.id,
                                                                    'class': 'avatar rounded-circle border',
                                                                    'alt': commission.user.vcard.name,
                                                                    'style': 'width: 32px; height: 32px;',
                                                                }).appendTo(object.userblock);
                                                                object.userblock.username = $(document.createElement('span')).addClass('ms-2 cursor-default').text(commission.user.username).appendTo(object.userblock);
                                                                object.delete = $(document.createElement('button')).attr({
                                                                    'type': 'button',
                                                                    'class': 'btn btn-light',
                                                                }).html('<i class="bi bi-trash"></i>').appendTo(object);
                                                                object.delete.hover(function(){
                                                                    $(this).removeClass('btn-light').addClass('btn-danger');
                                                                }, function(){
                                                                    $(this).removeClass('btn-danger').addClass('btn-light');
                                                                }).click(function(){
                                                                    object.remove();
                                                                });
                                                            }

                                                            // Add a create commission button
                                                            component.controls = $(document.createElement('div')).addClass('bg-gray-200 p-3 py-2 rounded-0').appendTo(component);
                                                            component.controls.create = $(document.createElement('button')).attr({
                                                                'type': 'button',
                                                                'class': 'btn btn-success w-100',
                                                            }).html('<i class="bi bi-plus-lg"></i>').appendTo(component.controls);
                                                            component.controls.create.click(function(){

                                                                // Create the Modal
                                                                self._builder.Component(
                                                                    "modal",
                                                                    {
                                                                        icon: "percent",
                                                                        title: self._builder.Locale.get("Commission"),
                                                                        color: 'success',
                                                                        callback: {
                                                                            load: function(component, modal){
                                                                                return new Promise((resolve, reject) => {
                                                                                    try {

                                                                                        // Set the parent
                                                                                        const modalParent = component.dialog;

                                                                                        // AJAX Request
                                                                                        $.ajax({
                                                                                            url: '/api/auth/users',
                                                                                            type: 'GET',dataType: 'json',
                                                                                            error: function(xhr, status, error) {
                                                                                                console.error('Error fetching users:', error);
                                                                                                reject(new Error(self._builder.Locale.get('Failed to fetch users')));
                                                                                            },
                                                                                            success: function(response) {

                                                                                                const members = response.records;
                                                                                                const options = [];
                                                                                                for(const [id, member] of Object.entries(members)){
                                                                                                    options.push({id: id, text: member.username});
                                                                                                }

                                                                                                // Create the Form
                                                                                                self._builder.Utility(
                                                                                                    'form',
                                                                                                    component.body,
                                                                                                    {
                                                                                                        callback: {
                                                                                                            val: function(values){
                                                                                                                values.user = members[values.assignedTo];
                                                                                                                delete values.assignedTo;
                                                                                                                values.rate = parseFloat((values.rate / 100).toFixed(2));
                                                                                                                return values;
                                                                                                            },
                                                                                                            submit: function(form){

                                                                                                                // Show the modal spinner
                                                                                                                modal.spinner(true);

                                                                                                                // Add the commission to the form
                                                                                                                add(form.val());

                                                                                                                // Close the modal
                                                                                                                modal.hide();
                                                                                                            },
                                                                                                        }
                                                                                                    },
                                                                                                    function(form,component){

                                                                                                        // Add event listener on the modal submit button
                                                                                                        modalParent.content.footer.submit.click(function(e){
                                                                                                            e.preventDefault();
                                                                                                            e.stopPropagation();
                                                                                                            form.submit();
                                                                                                        });

                                                                                                        // assignedTo
                                                                                                        form.add(
                                                                                                            'select2',
                                                                                                            {
                                                                                                                name: 'assignedTo',
                                                                                                                label: self._builder.Locale.get('User'),
                                                                                                                placeholder: self._builder.Locale.get('Select a user'),
                                                                                                                class: {
                                                                                                                    component: 'bg-gray-200 p-3 py-2 rounded-0',
                                                                                                                },
                                                                                                                options: options,
                                                                                                            }
                                                                                                        );

                                                                                                        // rate
                                                                                                        form.add(
                                                                                                            'number',
                                                                                                            {
                                                                                                                name: 'rate',
                                                                                                                label: self._builder.Locale.get('Rate'),
                                                                                                                placeholder: self._builder.Locale.get('Enter a rate'),
                                                                                                                required: true,
                                                                                                                value: calc(),
                                                                                                                class: {
                                                                                                                    component: 'bg-gray-200 p-3 pb-2 pt-0 rounded-0',
                                                                                                                },
                                                                                                            },
                                                                                                            function(input){
                                                                                                                input._component.input.attr({
                                                                                                                    'step':'1',
                                                                                                                    'max': calc(),
                                                                                                                    'min':'0',
                                                                                                                });
                                                                                                            }
                                                                                                        );

                                                                                                        // Resolve the promise
                                                                                                        resolve();
                                                                                                    },
                                                                                                );
                                                                                            },
                                                                                        });
                                                                                    } catch(e) { reject(e); }
                                                                                });
                                                                            },
                                                                        },
                                                                    },
                                                                    function(modal,component){

                                                                        // Styling
                                                                        component.body.addClass('p-0');

                                                                        // Show the modal
                                                                        modal.show();
                                                                    },
                                                                );
                                                            });

                                                            // Add a commissions to the component
                                                            for(const [key, commission] of Object.entries(serviceRecord.commissions ?? {})){
                                                                add(commission);
                                                            }

                                                            // Resolve the promise
                                                            resolve();
                                                        },
                                                    );
                                                },
                                            });
                                        },
                                    });
                                } catch(e) { reject(e); }
                            });
                        },
                    },
                },
                function(modal,component){

                    // Styling
                    component.body.addClass('p-0');

                    // Show the modal
                    modal.show();
                },
            );
        } else {
            update(this._services[id], record);
        }

        // return the instance
        return this;
    }

    archive(id, callback = null){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "archive",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("You are about to archive this service. Are you sure you want to continue?"),
                color: 'dark',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // AJAX Request - Archive the service
                        $.ajax({
                            url: '/api/services/archive?id='+id,
                            type: 'GET',dataType: 'json',
                            success: function(response) {

                                // If a callback is provided, call it
                                if (typeof callback === 'function') {
                                    callback(response);
                                }

                                // Close the modal
                                modal.hide();
                            }
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }

    lookup(callback = null, value = null){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                onEnter: false,
                icon: "search",
                title: this._builder.Locale.get("Lookup a Service"),
                color: 'info',
                callback: {
                    load: function(component, modal){
                        return new Promise((resolve, reject) => {
                            try {
                                // Set the parent
                                const parent = component.dialog;

                                // Create the Form
                                self._builder.Utility(
                                    'form',
                                    component.body,
                                    {
                                        callback: {
                                            submit: function(form){

                                                // Show the modal spinner
                                                modal.spinner(true);

                                                // AJAX Request
                                                $.ajax({
                                                    url: '/api/products/fetchAll',
                                                    headers: {'X-CSRF-Authorization': CSRF_KEY},
                                                    type: 'POST',dataType: 'json',
                                                    data: {
                                                        conditions: [
                                                            {key: 'sku', operator: '=', value: form.val('query')},
                                                            {key: 'upc', operator: '=', value: form.val('query')},
                                                            {key: 'name', operator: 'LIKE', value: '%'+form.val('query')+'%'},
                                                            {key: 'description', operator: 'LIKE', value: '%'+form.val('query')+'%'},
                                                            {key: 'type', operator: 'LIKE', value: '%'+form.val('query')+'%'},
                                                            {key: 'supplier', operator: 'LIKE', value: '%'+form.val('query')+'%'},
                                                            {key: 'brand', operator: 'LIKE', value: '%'+form.val('query')+'%'},
                                                        ],
                                                        conjunction: 'OR',
                                                    },
                                                    success: function(response) {

                                                        // If a callback is provided, call it with the response
                                                        if (typeof callback === 'function') {
                                                            callback(response.records);
                                                        }

                                                        // Close the modal
                                                        modal.hide();
                                                    }
                                                });
                                            },
                                        }
                                    },
                                    function(form,component){

                                        // Add event listener on the modal submit button
                                        parent.content.footer.submit.click(function(e){
                                            e.preventDefault();
                                            e.stopPropagation();
                                            form.submit();
                                        });

                                        // query
                                        form.add(
                                            'text',
                                            {
                                                name: 'query',
                                                placeholder: self._builder.Locale.get('Search...'),
                                                required: true,
                                                value: value,
                                                class: {
                                                    component: 'bg-gray-200 p-3 py-2 rounded-0',
                                                },
                                            }
                                        );

                                        // Resolve the promise
                                        resolve();
                                    },
                                );
                            } catch(e) { reject(e); }
                        });
                    },
                },
            },
            function(modal,component){

                // Styling
                component.body.addClass('p-0');

                // Show the modal
                modal.show();
            },
        );
    }

    create(){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                onEnter: false,
                icon: "cash-coin",
                title: this._builder.Locale.get("Create a Service"),
                color: 'success',
                callback: {
                    load: function(component, modal){
                        return new Promise((resolve, reject) => {
                            try {
                                // Set the parent
                                const parent = component.dialog;

                                // Lookup for a product
                                self.lookup(function(records){

                                    // Check if records are found
                                    if(records.length <= 0){
                                        reject(new Error(self._builder.Locale.get('No products found')));
                                    }

                                    // Create a product array
                                    const products = [];
                                    for(const [key, record] of Object.entries(records)){
                                        products.push({
                                            id: record.id,
                                            text: record.type + ' | ' + record.name + ' (' + (record.sku ?? record.upc ?? '') + ')' + ' - ' + record.description,
                                        });
                                    }

                                    // Create the Form
                                    self._builder.Utility(
                                        'form',
                                        component.body,
                                        {
                                            callback: {
                                                val: function(values){
                                                    // Set the default values
                                                    values.targetTable = self._properties.targetTable;
                                                    values.targetId = self._properties.targetId;
                                                    values.qty = 1;
                                                    values.price = 0;
                                                    values.currency = 'CAD';
                                                    values.commissions = '[]';
                                                    values.rate = (values.rate / 100).toFixed(2);
                                                    return values;
                                                },
                                                submit: function(form){

                                                    // Show the modal spinner
                                                    modal.spinner(true);

                                                    // Create the vCard
                                                    $.ajax({
                                                        url: '/api/services/create',
                                                        headers: {'X-CSRF-Authorization': CSRF_KEY},
                                                        type: 'POST',dataType: 'json',
                                                        data: form.val(),
                                                        success: function(response) {

                                                            // Add the new vCard to the services
                                                            self.add(response.record);

                                                            // Hide the modal
                                                            modal.hide();
                                                        }
                                                    });
                                                },
                                            }
                                        },
                                        function(form,component){

                                            // Add event listener on the modal submit button
                                            parent.content.footer.submit.click(function(e){
                                                e.preventDefault();
                                                e.stopPropagation();
                                                form.submit();
                                            });

                                            // product
                                            form.add(
                                                'select2',
                                                {
                                                    name: 'product',
                                                    label: self._builder.Locale.get('Service'),
                                                    placeholder: self._builder.Locale.get('Select a service'),
                                                    required: true,
                                                    options: products,
                                                    class: {
                                                        component: 'bg-gray-200 p-3 py-2 rounded-0',
                                                    },
                                                    callback: {
                                                        onChange: function(input){
                                                            let id = input.val();
                                                            let product = records[input.val()];
                                                            form.val({'rate': product.rate});
                                                        },
                                                    },
                                                }
                                            );

                                            // rate
                                            form.add(
                                                'number',
                                                {
                                                    name: 'rate',
                                                    label: self._builder.Locale.get('Rate'),
                                                    placeholder: self._builder.Locale.get('Enter a rate'),
                                                    required: true,
                                                    class: {
                                                        component: 'bg-gray-200 p-3 pb-2 pt-0 rounded-0',
                                                    },
                                                },
                                                function(input){
                                                    input._component.input.attr({
                                                        'step':'1',
                                                        'max':'100',
                                                        'min':'0',
                                                    });
                                                }
                                            );

                                            // Resolve the promise
                                            resolve();
                                        },
                                    );
                                });
                            } catch(e) { reject(e); }
                        });
                    },
                },
            },
            function(modal,component){

                // Styling
                component.body.addClass('p-0');

                // Show the modal
                modal.show();
            },
        );
    }
});
