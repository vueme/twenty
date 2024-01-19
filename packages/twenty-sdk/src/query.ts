export class Query {
  private operationType: string;
  private operationName: string;
  private fields: string[];
  private variables: { [key: string]: any };

  constructor() {
    this.operationType = '';
    this.operationName = '';
    this.fields = [];
    this.variables = {};
  }

  public setOperationType(type: string): Query {
    this.operationType = type;
    return this;
  }

  public setOperationName(name: string): Query {
    this.operationName = name;
    return this;
  }

  public setSelectFields(fields: string[]): Query {
    this.fields = fields;
    return this;
  }

  public setVariables(variables: { [key: string]: any }): Query {
    this.variables = variables;
    return this;
  }

  public getVariables(): { [key: string]: any } {
    return this.variables;
  }

  public build(): string {
    if (!this.operationType || !this.operationName) {
      throw new Error(
        'Operation type and operation name are required to build the query',
      );
    }
    let query = `${this.operationType} ${this.operationName} `;

    if (Object.keys(this.variables).length > 0) {
      query += '(';
      query += Object.keys(this.variables)
        .map((key) => `$${key}: ${typeof this.variables[key]}`)
        .join(', ');
      query += ')';
    }

    query += ' {';

    if (this.operationType.toLowerCase() === 'mutation') {
      query += `${this.operationName} `;
      if (Object.keys(this.variables).length > 0) {
        query += '(';
        query += Object.keys(this.variables)
          .map((key) => `${key}: $${key}`)
          .join(', ');
        query += ')';
      }
    }

    let fields = this.fields;

    if (this.fields.length === 0) {
      fields = ['id'];
    }

    query += ' { ' + fields.join(' ') + ' }';

    query += ' }';

    return query;
  }
}