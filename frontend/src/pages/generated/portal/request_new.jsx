// Native React page. Data contract: portal/request_new.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <a className={"small"} href={"/portal/requests/"}>
        {"‹ Service requests"}
      </a>
      {"\n"}
      <h1 className={"mt-s"}>{"Report a problem"}</h1>
      {"\n"}
      <p className={"muted mb"}>
        {
          "Pick the unit that has the fault. You will see straight away whether it is under warranty."
        }
      </p>
      {"\n"}
      {data.choice1 === 0 ? (
        <>
          <div className={"pcard center"}>
            <p className={"muted"}>
              {
                "Report a problem becomes available after installation is complete."
              }
            </p>
          </div>
        </>
      ) : data.choice1 === 1 ? (
        <>
          {"\n"}
          <ActionForm method={"post"} className={"stack"}>
            <CsrfField />
            <Field type={"hidden"} name={"project"} value={text(data.v2)} />
            {"\n  "}
            <div className={"pcard"}>
              <h3 className={"mb-s"}>{"Which unit?"}</h3>
              {"\n    "}
              {data.rows3?.length ? (
                data.rows3.map((row3, index) => (
                  <Fragment key={index}>
                    <label
                      className={"check"}
                      style={cssStyle(
                        "padding:.55rem 0;border-bottom:1px solid var(--line)",
                      )}
                    >
                      <Field
                        type={"radio"}
                        name={"serial"}
                        value={text(row3.v4)}
                        {...(row3.attr5 === 0 ? { checked: true } : {})}
                        required={true}
                      />
                      {"\n      "}
                      <span className={"grow"}>
                        <b>{row3.v6}</b>{" "}
                        <span className={"badge " + text(row3.v7)}>
                          {row3.v8}
                        </span>
                        <br />
                        <span className={"small muted mono"}>{row3.v9}</span>
                      </span>
                    </label>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n  "}
            </div>
            {"\n  "}
            <div className={"pcard"}>
              <div className={"fields"}>
                {"\n    "}
                <FieldGroup className={"field"}>
                  <label htmlFor={"fc"}>
                    {"Fault code on the inverter display"}
                  </label>
                  <Field
                    id={"fc"}
                    className={"inp"}
                    name={"fault_code"}
                    value={text(data.v10)}
                    list={"codes"}
                    placeholder={"E04"}
                  />
                  <datalist id={"codes"}>
                    <option>{"E01"}</option>
                    <option>{"E04"}</option>
                    <option>{"E07"}</option>
                    <option>{"E12"}</option>
                    <option>{"No display"}</option>
                  </datalist>
                </FieldGroup>
                {"\n    "}
                <FieldGroup className={"field full"}>
                  <label htmlFor={"d"}>{"What is happening?"}</label>
                  <TextArea
                    id={"d"}
                    className={"inp"}
                    name={"description"}
                    placeholder={
                      "For example: no power since the rain last night"
                    }
                  >
                    {data.v11}
                  </TextArea>
                </FieldGroup>
                {"\n  "}
              </div>
            </div>
            {"\n  "}
            <button className={"btn btn-primary btn-lg btn-block"}>
              {"Send request"}
            </button>
            {"\n"}
          </ActionForm>
        </>
      ) : null}
      {"\n"}
    </>
  );
}
