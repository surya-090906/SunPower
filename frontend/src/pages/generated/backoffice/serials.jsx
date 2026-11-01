// Native React page. Data contract: backoffice/serials.
import {
  Fragment,
  cssStyle,
  text,
  Field,
  SelectField,
  ActionForm,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Serial explorer"}</h1>
          <div className={"sub"}>
            {
              "Find any unit by serial number, and see exactly which customer it went to and when its warranty ends."
            }
          </div>
        </div>
      </div>
      {"\n"}
      <ActionForm method={"get"} className={"row mb"}>
        <Field
          className={"inp"}
          style={cssStyle("max-width:360px")}
          name={"q"}
          value={text(data.v1)}
          placeholder={"Serial, product, project code or customer"}
          autoFocus={true}
        />
        {"\n  "}
        <SelectField
          className={"inp"}
          style={cssStyle("width:auto")}
          name={"status"}
          data-autosubmit={true}
        >
          <option value={""}>{"Any status"}</option>
          {data.rows2?.length ? (
            data.rows2.map((row2, index) => (
              <Fragment key={index}>
                <option
                  value={text(row2.v3)}
                  {...(row2.attr4 === 0 ? { selected: true } : {})}
                >
                  {row2.v5}
                </option>
              </Fragment>
            ))
          ) : (
            <></>
          )}
        </SelectField>
        <button className={"btn btn-line"}>{"Search"}</button>
      </ActionForm>
      {"\n"}
      <div className={"card"}>
        <div className={"card-b tight tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Serial"}</th>
                <th>{"Item"}</th>
                <th>{"Status"}</th>
                <th>{"Customer"}</th>
                <th>{"Warranty"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows6?.length ? (
                data.rows6.map((row6, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td>
                        <a
                          className={"mono"}
                          href={"/app/inventory/serials/" + text(row6.v7) + "/"}
                        >
                          {row6.v8}
                        </a>
                      </td>
                      <td>{row6.v9}</td>
                      <td>
                        <span className={"badge " + text(row6.v10)}>
                          {row6.v11}
                        </span>
                      </td>
                      <td>
                        {row6.choice12 === 0 ? (
                          <>
                            <a href={"/app/p/" + text(row6.v13) + "/"}>
                              {row6.v14}
                            </a>{" "}
                            <span className={"tiny faint"}>{row6.v15}</span>
                          </>
                        ) : row6.choice12 === 1 ? (
                          <>{"–"}</>
                        ) : null}
                      </td>
                      <td>
                        {row6.choice16 === 0 ? (
                          <>
                            <span className={"badge " + text(row6.v17)}>
                              {row6.v18}
                            </span>
                          </>
                        ) : row6.choice16 === 1 ? (
                          <>
                            <span className={"faint small"}>{row6.v19}</span>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <>
                  <tr>
                    <td colSpan={"5"} className={"empty"}>
                      {"No units match."}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {"\n"}
    </>
  );
}
