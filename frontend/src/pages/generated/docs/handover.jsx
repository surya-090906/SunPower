// Native React page. Data contract: docs/handover.
import { Fragment, cssStyle, text, Partial } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"toolbar-print"}>
        <button className={"btn btn-dark"} onClick={() => window.print()}>
          {"Print / save as PDF"}
        </button>
      </div>
      {"\n"}
      <div className={"doc"}>
        {"\n  "}
        <Partial part={data.part1} state={state} />
        {"\n  "}
        <p>
          {
            "This certifies that the solar system below was installed, tested and handed over at the address above."
          }
        </p>
        {"\n  "}
        <table>
          <tbody>
            <tr>
              <th style={cssStyle("width:30%")}>{"System installed"}</th>
              <td>
                <b>
                  {data.v2}
                  {" kW "}
                  {data.v3}
                </b>
                {data.choice4 === 0 ? (
                  <>
                    {" ("}
                    {data.v5}
                    {")"}
                  </>
                ) : null}
              </td>
            </tr>
            <tr>
              <th>{"Installed on"}</th>
              <td>
                {data.v6}
                {" to "}
                {data.v7}
                {" ("}
                {data.v8}
                {" hours)"}
              </td>
            </tr>
            <tr>
              <th>{"Generation test"}</th>
              <td>
                {data.v9}
                {" kW measured at handover"}
              </td>
            </tr>
            <tr>
              <th>{"Installation crew"}</th>
              <td>{data.v10}</td>
            </tr>
            <tr>
              <th>{"Checks completed"}</th>
              <td>
                {
                  "Stands mounted · panels laid · boxes connected · earthing done · generation tested"
                }
              </td>
            </tr>
          </tbody>
        </table>
        {"\n  "}
        <h3 style={cssStyle("margin-top:1.2rem")}>
          {"Equipment and warranty"}
        </h3>
        {"\n  "}
        <table>
          <thead>
            <tr>
              <th>{"Item"}</th>
              <th>{"Serial number"}</th>
              <th>{"Warranty until"}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows11?.length ? (
              data.rows11.map((row11, index) => (
                <Fragment key={index}>
                  <tr>
                    <td>{row11.v12}</td>
                    <td className={"mono"}>{row11.v13}</td>
                    <td>{row11.v14}</td>
                  </tr>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </tbody>
        </table>
        {"\n  "}
        {data.choice15 === 0 ? (
          <>
            <h3 style={cssStyle("margin-top:1.2rem")}>
              {"Photographs of the finished installation"}
            </h3>
            <div className={"photos"}>
              {data.rows16?.length ? (
                data.rows16.map((row16, index) => (
                  <Fragment key={index}>
                    <img src={text(row16.v17)} alt={text(row16.v18)} />
                  </Fragment>
                ))
              ) : (
                <></>
              )}
            </div>
          </>
        ) : null}
        {"\n  "}
        <div className={"sig"} style={cssStyle("margin-top:1.5rem")}>
          <div
            style={cssStyle(
              "font-size:11px;text-transform:uppercase;color:#6b7280",
            )}
          >
            {"Accepted by the customer"}
          </div>
          {"\n    "}
          {data.choice19 === 0 ? (
            <>
              <img src={text(data.v20)} alt={"Customer signature"} />
            </>
          ) : null}
          {"\n    "}
          <div>
            <b>{data.v21}</b>
            {" · "}
            {data.v22}
            {data.choice23 === 0 ? (
              <>
                {" · captured on site ("}
                {data.v24}
                {", "}
                {data.v25}
                {")"}
              </>
            ) : null}
          </div>
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
