import DS from 'ember-data';

let { Model, attr, belongsTo  } = DS;

export default Model.extend({
  description: attr("string"),
  shortTitle: attr("string"),
  approved: attr('boolean'),
  archived: attr('boolean'),
  title: attr('string'),
  numberVp: attr('string'),
  numberVr: attr('string'),

  agendaItem: belongsTo('agendaitem'),
  procedurestep: belongsTo('procedurestep'),
  publication: belongsTo('publication'),
  newsletterInfo: belongsTo('newsletter-info'),
  documentType: belongsTo('document-type'),
  confidentiality: belongsTo('confidentiality')
});
