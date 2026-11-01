// Native React page. Data contract: backoffice/pipeline.
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
          <h1>{"CRM pipeline"}</h1>
          <div className={"sub"}>
            {
              "Every enquiry from first call to handover. Nothing here can be deleted, only marked lost with a reason."
            }
          </div>
        </div>
        {"\n  "}
        {data.choice1 === 0 ? (
          <>
            <a className={"btn btn-primary"} href={"/app/crm/new/"}>
              {"+ Log call or WhatsApp enquiry"}
            </a>
          </>
        ) : null}
      </div>
      {"\n"}
      <ActionForm method={"get"} className={"row mb"}>
        {"\n  "}
        <Field
          className={"inp"}
          style={cssStyle("max-width:260px")}
          name={"q"}
          value={text(data.v2)}
          placeholder={"Search name, phone or code"}
        />
        {"\n  "}
        <SelectField
          className={"inp"}
          style={cssStyle("width:auto")}
          name={"owner"}
          data-autosubmit={true}
        >
          <option
            value={"all"}
            {...(data.attr3 === 0 ? { selected: true } : {})}
          >
            {"Everyone's leads"}
          </option>
          <option
            value={"me"}
            {...(data.attr4 === 0 ? { selected: true } : {})}
          >
            {"My leads"}
          </option>
        </SelectField>
        {"\n  "}
        <SelectField
          className={"inp"}
          style={cssStyle("width:auto")}
          name={"view"}
          data-autosubmit={true}
        >
          <option
            value={"board"}
            {...(data.attr5 === 0 ? { selected: true } : {})}
          >
            {"Board"}
          </option>
          <option
            value={"list"}
            {...(data.attr6 === 0 ? { selected: true } : {})}
          >
            {"List"}
          </option>
        </SelectField>
        {"\n  "}
        {data.choice7 === 0 ? (
          <>
            <SelectField
              className={"inp"}
              style={cssStyle("width:auto")}
              name={"stage"}
              data-autosubmit={true}
            >
              <option value={""}>{"All stages"}</option>
              {data.rows8?.length ? (
                data.rows8.map((row8, index) => (
                  <Fragment key={index}>
                    <option
                      value={text(row8.v9)}
                      {...(row8.attr10 === 0 ? { selected: true } : {})}
                    >
                      {row8.v11}
                    </option>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
            </SelectField>
          </>
        ) : null}
        {"\n  "}
        <button className={"btn btn-line"}>{"Search"}</button>
        {"\n  "}
        <span className={"muted small"}>
          {"Also: "}
          <a href={"?view=list&stage=completed"}>
            {"completed ("}
            {data.v12}
            {")"}
          </a>
          {" · "}
          <a href={"?view=list&stage=lost"}>
            {"lost ("}
            {data.v13}
            {")"}
          </a>
        </span>
        {"\n"}
      </ActionForm>
      {"\n"}
      {data.choice14 === 0 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Project"}</th>
                    <th>{"Customer"}</th>
                    <th>{"System"}</th>
                    <th>{"Stage"}</th>
                    <th>{"Next step"}</th>
                    <th>{"Owner"}</th>
                    <th>{"In stage"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows15?.length ? (
                    data.rows15.map((row15, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>
                            <a
                              className={"mono"}
                              href={"/app/p/" + text(row15.v16) + "/"}
                            >
                              {row15.v17}
                            </a>
                          </td>
                          <td>{row15.v18}</td>
                          <td>{row15.v19}</td>
                          <td>
                            <span className={"badge " + text(row15.v20)}>
                              {row15.v21}
                            </span>
                          </td>
                          <td className={"small"}>
                            {row15.choice22 === 0 ? <>{row15.v23}</> : null}
                          </td>
                          <td className={"small"}>{row15.v24}</td>
                          <td className={"small"}>
                            {row15.choice25 === 0 ? (
                              <>
                                <span className={"badge b-amber"}>
                                  {row15.v26}
                                  {" d"}
                                </span>
                              </>
                            ) : row15.choice25 === 1 ? (
                              <>
                                {row15.v27}
                                {" d"}
                              </>
                            ) : null}
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"7"} className={"empty"}>
                          {"No projects match."}
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
      ) : data.choice14 === 1 ? (
        <>
          {"\n"}
          <div className={"kanban"}>
            {"\n  "}
            {data.rows28?.length ? (
              data.rows28.map((row28, index) => (
                <Fragment key={index}>
                  <div className={"kcol"}>
                    <h3>
                      <span>{row28.v29}</span>
                      <span>{row28.v30}</span>
                    </h3>
                    {"\n    "}
                    {row28.rows31?.length ? (
                      row28.rows31.map((row31, index) => (
                        <Fragment key={index}>
                          <a
                            className={"kcard"}
                            href={"/app/p/" + text(row31.v32) + "/"}
                          >
                            {"\n      "}
                            <div className={"spread"}>
                              <span className={"t"}>{row31.v33}</span>
                              {row31.choice34 === 0 ? (
                                <>
                                  <span className={"badge b-red"}>
                                    {"overdue"}
                                  </span>
                                </>
                              ) : row31.choice34 === 1 ? (
                                <>
                                  <span className={"badge b-amber"}>
                                    {row31.v35}
                                    {" d"}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            {"\n      "}
                            <div className={"m"}>
                              {row31.v36}
                              {row31.choice37 === 0 ? (
                                <>{" · subsidy"}</>
                              ) : null}
                            </div>
                            {"\n      "}
                            <div className={"m mono"}>
                              {row31.v38}
                              {" · "}
                              {row31.v39}
                            </div>
                            {"\n      "}
                            {row31.choice40 === 0 ? (
                              <>
                                <div
                                  className={"m"}
                                  style={cssStyle("margin-top:.35rem")}
                                >
                                  {"→ "}
                                  {row31.v41}
                                </div>
                              </>
                            ) : null}
                            {"\n    "}
                          </a>
                        </Fragment>
                      ))
                    ) : (
                      <>
                        <div
                          className={"faint small center"}
                          style={cssStyle("padding:.8rem")}
                        >
                          {"Empty"}
                        </div>
                      </>
                    )}
                    {"\n  "}
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
            {"\n"}
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n"}
    </>
  );
}
