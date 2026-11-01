// Native React page. Data contract: backoffice/delivery.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/field/"}>
            {"‹ My day"}
          </a>
          <h1 style={cssStyle("margin-top:.3rem")}>{"Confirm delivery"}</h1>
          <div className={"sub"}>
            {data.v1}
            {" · "}
            {data.v2}
            {" · "}
            {data.v3}
          </div>
        </div>
      </div>
      {"\n"}
      <div className={"card mb"} style={cssStyle("max-width:720px")}>
        <div className={"card-h"}>
          <h2>{"Unloaded equipment"}</h2>
        </div>
        <div className={"card-b tight tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Item"}</th>
                <th className={"num"}>{"Qty"}</th>
                <th>{"Serial numbers"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows4?.length ? (
                data.rows4.map((row4, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td>{row4.v5}</td>
                      <td className={"num"}>{row4.v6}</td>
                      <td className={"mono small"}>{row4.v7}</td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {"\n"}
      <ActionForm
        method={"post"}
        className={"card"}
        style={cssStyle("max-width:720px")}
      >
        <div className={"card-b stack"}>
          <CsrfField />
          {"\n  "}
          <FieldGroup className={"field"}>
            <label>{"Received by"}</label>
            <Field
              className={"inp"}
              name={"received_by"}
              value={text(data.v8)}
            />
          </FieldGroup>
          {"\n  "}
          <button className={"btn btn-ok btn-lg btn-block"}>
            {"Confirm delivery"}
          </button>
          {"\n  "}
          <p className={"hint"}>
            {
              "Confirming starts the warranty on every serial number above, counted from today."
            }
          </p>
          {"\n"}
        </div>
      </ActionForm>
      {"\n"}
    </>
  );
}
