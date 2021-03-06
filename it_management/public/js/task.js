frappe.ui.form.on('Task', {
	onload: function (frm) {
		// restrict Dynamic Links to IT Mnagement
		frm.set_query('dynamic_type', 'it_management_table', function () {
			return {
				'filters': {
					'module': 'IT Management',
					'istable': 0,
				}
			};
		});
	},
	refresh: function (frm) {
		cur_frm.add_custom_button('Issue', function () { frm.trigger('make_ticket') }, 'Make');
	},
	make_ticket: function (frm) {
		let options = {
			'doctype': 'Issue',
			'subject': frm.get_field('subject').get_value(),
			'description': frm.get_field('description').get_value(),
			'priority': frm.get_field('priority').get_value(),
			'task': frm.doc.name,
			'project': frm.get_field('project').get_value(),
		};

		frappe.db.insert(options).then((issue) => {
			frappe.call({
				method: "it_management.utils.relink_email",
				args: {
					"doctype": "Task",
					"name": frm.doc.name,
					"issue": issue.name,
				}
			}).then(() => frm.refresh());

			frappe.show_alert({
				indicator: 'green',
				message: __(`Issue ${issue.name} created.`), 
			}).click(() => {
				frappe.set_route('Form', 'Issue', issue.name)
			});

			frm.timeline.insert_comment('Comment', `${issue.doctype} <a href="${
				frappe.utils.get_form_link(issue.doctype, issue.name)}">${issue.name}</a> created.`);
		});
	}
});
