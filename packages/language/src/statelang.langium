grammar Statelang
entry Model: (statemachine+= Statemachine)*;
interface Expression {}
interface BinaryExpression extends Expression {
    left: Expression
    right: Expression
    op: string
}
interface IntExpression extends Expression { value: number }
interface FloatExpression extends Expression { value: number }
interface BoolExpression extends Expression { value: boolean }
interface StringExpression extends Expression { value: string }
interface ReferenceExpression extends Expression { value: string }
Expression returns Expression:
    OrExpression
;

OrExpression returns Expression:
    AndExpression ({BinaryExpression.left=current} op='||' right=AndExpression)*
;

AndExpression returns Expression:
    EqualityExpression ({BinaryExpression.left=current} op='&&' right=EqualityExpression)*
;

EqualityExpression returns Expression:
    RelationalExpression ({BinaryExpression.left=current} op=('==' | '!=') right=RelationalExpression)*
;

RelationalExpression returns Expression:
    AddExpression ({BinaryExpression.left=current} op=('<' | '<=' | '>' | '>=') right=AddExpression)*
;

AddExpression returns Expression:
    MultExpression ({BinaryExpression.left=current} op=('+' | '-') right=MultExpression)*
;

MultExpression returns Expression:
    Primary ({BinaryExpression.left=current} op=('*' | '/' | '%') right=Primary)*
;

Primary returns Expression:
      {IntExpression} value=INT
    | {FloatExpression} value=FLOAT
    | {BoolExpression} value=BOOLEAN
    | {StringExpression} value=STRING
    | {ReferenceExpression} value=ID 
    | '(' Expression ')'
;
VariableDeclaration:
    'var' type=ID name=ID ('=' value=Expression)? 
    //';'
;

Statemachine:
    'statemachine' name=ID '{'
        (variables+=VariableDeclaration)*
        (initial=InitialState)?
        (states+=State)*
        (transitions+=Transition)*
    '}';

State:
    (final?='final')? 'state' name=ID
    ('entry' entryAction=Action)?
    ('exit' exitAction=Action)?
;

InitialState:
    'initial' target=[State] ('/' action=Action)? //';'
;

Transition:
    source=[State] 
    ARROW target=[State] 
    ('on' event=Event)
    (action=Action)?
    (guard=Guard)?
;

Event:
    name=ID ('(' params+=Parameter (',' params+=Parameter)* ')')?;
    
Parameter:
    type=ID name=ID;

Action:
    '/'
    ('spec' description=STRING)?
    ('impl' target=ID content=IMPL_BODY)?
    (guard=Guard)?;

Guard:
    '[' condition=Expression ']';

terminal ARROW: '->';
hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal FLOAT returns number: /[0-9]+\.[0-9]+([fF])?/;
terminal BOOLEAN returns boolean: /true|false/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal IMPL_BODY: /<<[\s\S]*?>>/;
