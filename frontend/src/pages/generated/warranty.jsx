// Native React page. Data contract: docs/warranty.
import { Fragment, cssStyle, Partial } from "@ui/runtime";
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
            "Each unit carries its own warranty, counted from its delivery date. Quote the serial number when you report a problem."
          }
        </p>
        {"\n  "}
        <table>
          <thead>
            <tr>
              <th>{"Item"}</th>
              <th>{"Serial number"}</th>
              <th>{"From"}</th>
              <th>{"Until"}</th>
              <th>{"Status"}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows2?.length ? (
              data.rows2.map((row2, index) => (
                <Fragment key={index}>
                  <tr>
                    <td>{row2.v3}</td>
                    <td className={"mono"}>{row2.v4}</td>
                    <td>{row2.v5}</td>
                    <td>
                      <b>{row2.v6}</b>
                    </td>
                    <td>{row2.v7}</td>
                  </tr>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </tbody>
        </table>
        {"\n  "}
        <p style={cssStyle("font-size:12px;color:#4b5563")}>
          {
            "Warranty does not cover damage from lightning, flooding, physical impact or unauthorised repair. A replaced unit carries the remaining warranty of the unit it replaces."
          }
        </p>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
