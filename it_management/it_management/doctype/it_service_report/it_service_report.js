// Copyright (c) 2019, IT-Geräte und IT-Lösungen wie Server, Rechner, Netzwerke und E-Mailserver sowie auch Backups, and contributors
// For license information, please see license.txt

frappe.ui.form.on('IT Service Report', {
	refresh: function(frm) {
		// check if entry already saved
		if (frm.doc.__islocal) {
			// get and set current loggedin employee
			var user = frappe.user_info().email;

			frappe.call({
				method:"frappe.client.get_list",
				args:{
				doctype:"Employee",
				filters: [
					["user_id","=", user]
				],
				fields: ["name"]
				},
				callback: function(r) {
					if (r.message[0]) {
						cur_frm.set_value('employee', r.message[0].name);
					}
					
					//Obsolet:
					/* //get and set copy of it management table of it ticket
					frappe.call({
						method: "frappe.client.get_list",
						args: {
							doctype:"IT Management Table",
							filters: [
								["parent","=", cur_frm.doc.issue],
								["checked","=", 0]
							],
							fields: ["name", "dynamic_name", "dynamic_type", "note"],
							parent: "IT Ticket",
						},
						callback: function(r) {
							if (r.message) {
								console.log(r.message);
								var i;
								for (i=0; i<r.message.length; i++) {
									var child = cur_frm.add_child('table_13');
									frappe.model.set_value(child.doctype, child.name, 'dynamic_type', r.message[i].dynamic_type);
									frappe.model.set_value(child.doctype, child.name, 'dynamic_name', r.message[i].dynamic_name);
									frappe.model.set_value(child.doctype, child.name, 'note', r.message[i].note);
									frappe.model.set_value(child.doctype, child.name, 'identifier', r.message[i].name);
									cur_frm.refresh_field('table_13');
								}
							}
						}
					}); */
					//get and set copy of it management table of issue
					if (cur_frm.doc.issue) {
						/* frappe.call({
							"method": "frappe.client.get_list",
							"args": {
								"doctype":"IT Management Table",
								"filters": [
									["parent","=", cur_frm.doc.issue],
									["checked","=", 0]
								],
								"fields": ["name", "dynamic_name", "dynamic_type", "note"],
								"parent": "Issue"
							},
							"callback": function(r) {
								if (r.message) {
									console.log(r.message);
									var i;
									for (i=0; i<r.message.length; i++) {
										var child = cur_frm.add_child('table_13');
										frappe.model.set_value(child.doctype, child.name, 'dynamic_type', r.message[i].dynamic_type);
										frappe.model.set_value(child.doctype, child.name, 'dynamic_name', r.message[i].dynamic_name);
										frappe.model.set_value(child.doctype, child.name, 'note', r.message[i].note);
										frappe.model.set_value(child.doctype, child.name, 'identifier', r.message[i].name);
										cur_frm.refresh_field('table_13');
									}
								}
							}
						}); */
						frappe.call({
							"method": "it_management.it_management.doctype.it_service_report.it_service_report.fetch_it_management_table_of_issue",
							"args": {
								"issue": cur_frm.doc.issue
							},
							"callback": function(r) {
								if (r.message) {
									console.log(r.message);
									var i;
									for (i=0; i<r.message.length; i++) {
										var child = cur_frm.add_child('table_13');
										frappe.model.set_value(child.doctype, child.name, 'dynamic_type', r.message[i].dynamic_type);
										frappe.model.set_value(child.doctype, child.name, 'dynamic_name', r.message[i].dynamic_name);
										frappe.model.set_value(child.doctype, child.name, 'note', r.message[i].note);
										frappe.model.set_value(child.doctype, child.name, 'identifier', r.message[i].name);
										cur_frm.refresh_field('table_13');
									}
								}
							}
						});
					}
				}
			}); 
			
			// set date to today
			cur_frm.set_value('date', frappe.datetime.now_date());
		}
		if (cur_frm.doc.docstatus == 1) {
			// Custom BTN "Make Sales Invoice"
			frm.add_custom_button('Sales Invoice', function () { frm.trigger('make_sales_invoice') }, __("Make"));
		}
	},
	before_save: function(frm) {
		// calculate and set time diff in hours as float
		var time_diff = (moment(frappe.datetime.now_date() + " " + cur_frm.doc.end).diff(moment(frappe.datetime.now_date() + " " + cur_frm.doc.start),"seconds")) / 3600;
		cur_frm.set_value('time_total', time_diff);
		
		// if billing_total == 0, set billing_total = time_total
		if (!cur_frm.doc.billing_time) {
			cur_frm.set_value('billing_time', time_diff);
		}
	},
	make_sales_invoice: function (frm) {
		var customer = '';
		frappe.call({
            "method": "frappe.client.get",
            "args": {
                "doctype": "Issue",
                "name": frm.doc.issue
            },
            "callback": function(response) {
                var issue = response.message;

                if (issue) {
                    customer = issue.customer;
                }
				let dialog = new frappe.ui.Dialog({
					title: __("Select Item (optional)"),
					fields: [
						{"fieldtype": "Link", "label": __("Item Code"), "fieldname": "item_code", "options":"Item"},
						{"fieldtype": "Link", "label": __("Customer"), "fieldname": "customer", "options":"Customer", "default": customer}
					]
				});

				dialog.set_primary_action(__("Make Sales Invoice"), () => {
					var args = dialog.get_values();
					if(!args) return;
					dialog.hide();
					return frappe.call({
						type: "GET",
						method: "it_management.it_management.doctype.it_service_report.it_service_report.make_sales_invoice",
						args: {
							"source_name": frm.doc.timesheet,
							"item_code": args.item_code,
							"customer": args.customer
						},
						freeze: true,
						callback: function(r) {
							if(!r.exc) {
								frappe.model.sync(r.message);
								frappe.set_route("Form", r.message.doctype, r.message.name);
							}
						}
					});
				});
				dialog.show();
            }
        });
	}
});
